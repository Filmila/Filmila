import { supabase } from '../config/supabase';
import { Film } from '../types';

export const filmService = {
  async createFilm(film: Omit<Film, 'id'>): Promise<Film> {
    // Validate the upload date
    const uploadDate = new Date(film.upload_date);
    if (isNaN(uploadDate.getTime()) || uploadDate > new Date()) {
      throw new Error('Invalid upload date');
    }

    // Validate the video URL
    if (!film.video_url || !film.video_url.startsWith('https://')) {
      throw new Error('Invalid video URL');
    }

    const { data, error } = await supabase
      .from('films')
      .insert([{
        title: film.title,
        filmmaker: film.filmmaker,
        description: film.description,
        price: film.price,
        views: film.views,
        revenue: film.revenue,
        status: film.status,
        rejection_note: film.rejection_note,
        upload_date: uploadDate.toISOString(),
        video_url: film.video_url,
        last_action: film.last_action,
        version: film.version
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFilms(): Promise<Film[]> {
    const { data, error } = await supabase
      .from('films')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getFilmsByFilmmaker(email: string): Promise<Film[]> {
    const { data, error } = await supabase
      .from('films')
      .select('*')
      .eq('filmmaker', email)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateFilmStatus(id: string, status: Film['status'], rejection_note?: string): Promise<Film> {
    try {
      console.log('Updating film status:', { id, status, rejection_note });

      // First verify the user is an admin
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting user:', authError);
        throw new Error('Failed to get authenticated user');
      }

      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      // Get the session to check the role - only get it once and reuse
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error('Failed to get session');
      }

      if (!session) {
        console.error('No session found');
        throw new Error('No active session');
      }

      // Debug JWT contents
      const jwtPayload = session.access_token ? JSON.parse(atob(session.access_token.split('.')[1])) : null;
      console.log('JWT Debug:', {
        payload: jwtPayload,
        app_metadata: session.user.app_metadata,
        user_metadata: session.user.user_metadata,
        email: user.email,
        user_id: user.id
      });

      // Get the role from app_metadata first, then fallback to other sources
      const appMetadataRole = session.user.app_metadata?.role;
      const jwtRole = jwtPayload?.role;
      const metadataRole = session.user.user_metadata?.role;
      
      // Prioritize app_metadata.role, then fallback to other sources
      const userRole = appMetadataRole || jwtRole || metadataRole;

      console.log('User role check:', {
        appMetadataRole,
        jwtRole,
        metadataRole,
        finalRole: userRole,
        email: user.email,
        user_id: user.id,
        token: session.access_token ? 'present' : 'missing'
      });

      // Check for admin role in a case-insensitive way
      if (!userRole || userRole.toLowerCase() !== 'admin') {
        console.error('User is not an admin:', {
          appMetadataRole,
          jwtRole,
          metadataRole,
          finalRole: userRole,
          email: user.email,
          user_id: user.id
        });
        throw new Error('Only admins can update film status. Please ensure you have the admin role in your app_metadata.');
      }

      // First verify the film exists and get its current data
      const { data: existingFilm, error: checkError } = await supabase
        .from('films')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('Error checking film existence:', checkError);
        throw new Error(`Film not found: ${checkError.message}`);
      }

      if (!existingFilm) {
        console.error('Film not found:', { id, user_id: user.id });
        throw new Error(`Film with ID ${id} not found`);
      }

      console.log('Current film data:', {
        ...existingFilm,
        user_id: user.id
      });

      // Clean up the video URL if it contains test code
      let videoUrl = existingFilm.video_url;
      if (videoUrl && videoUrl.includes('async()=>{')) {
        // Extract the actual URL by removing the test code
        const parts = videoUrl.split('.async()=>{');
        if (parts.length > 1) {
          const domain = parts[0];
          const path = parts[1].split('}')[1];
          // Remove any duplicate .amazonaws.com
          videoUrl = `${domain}.amazonaws.com${path}`.replace('.amazonaws.com.amazonaws.com', '.amazonaws.com');
        }
      }

      console.log('Cleaned video URL:', videoUrl);

      // Try a direct update with minimal fields
      const updateData = {
        status: status,
        rejection_note: rejection_note || null,
        last_action: {
          type: status === 'approved' ? 'approve' : 'reject',
          date: new Date().toISOString(),
          admin: user.email
        },
        updated_at: new Date().toISOString()
      };

      console.log('Attempting update with data:', {
        id,
        updateData,
        user_id: user.id
      });

      const { error: updateError } = await supabase
        .from('films')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating film:', {
          error: updateError,
          user_id: user.id,
          film_id: id,
          role: userRole,
          updateData
        });
        throw new Error(`Failed to update film: ${updateError.message}`);
      }

      // Verify the update was successful by fetching the updated film
      const { data: updatedFilm, error: fetchError } = await supabase
        .from('films')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated film:', {
          error: fetchError,
          user_id: user.id,
          film_id: id,
          role: userRole
        });
        throw new Error(`Failed to verify film update: ${fetchError.message}`);
      }

      if (!updatedFilm) {
        console.error('No film found after update:', { 
          id,
          user_id: user.id,
          role: userRole
        });
        throw new Error(`Film with ID ${id} not found after update`);
      }

      console.log('Post-update film state:', {
        id: updatedFilm.id,
        title: updatedFilm.title,
        status: updatedFilm.status,
        last_action: updatedFilm.last_action,
        updated_at: updatedFilm.updated_at,
        user_id: user.id,
        role: userRole
      });

      // Verify the status was actually updated
      if (updatedFilm.status !== status) {
        console.error('Status mismatch after update:', {
          expected: status,
          actual: updatedFilm.status,
          updated_at: updatedFilm.updated_at,
          user_id: user.id,
          role: userRole
        });
        throw new Error('Film status was not updated correctly');
      }

      return updatedFilm;
    } catch (error) {
      console.error('Error in updateFilmStatus:', error);
      throw error;
    }
  },

  async deleteFilm(id: string): Promise<void> {
    const { error } = await supabase
      .from('films')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 