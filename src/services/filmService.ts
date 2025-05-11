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

    // Validate the thumbnail URL
    if (!film.thumbnail_url || !film.thumbnail_url.startsWith('https://')) {
      throw new Error('Invalid thumbnail URL');
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
        thumbnail_url: film.thumbnail_url,
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

      // Get the session to check the role
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error('Failed to get session');
      }

      if (!session) {
        console.error('No session found');
        throw new Error('No active session');
      }

      // Get the role from app_metadata first, then fallback to other sources
      const appMetadataRole = session.user.app_metadata?.role;
      const jwtRole = session.access_token ? JSON.parse(atob(session.access_token.split('.')[1]))?.role : null;
      const metadataRole = session.user.user_metadata?.role;
      
      const userRole = appMetadataRole || jwtRole || metadataRole;

      console.log('User role check:', {
        appMetadataRole,
        jwtRole,
        metadataRole,
        finalRole: userRole,
        email: user.email,
        user_id: user.id
      });

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

      // First verify the film exists
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

      console.log('Current film state:', {
        id: existingFilm.id,
        status: existingFilm.status,
        updated_at: existingFilm.updated_at
      });

      // Create update data with current timestamp
      const now = new Date().toISOString();
      const updateData = {
        status: status,
        rejection_note: rejection_note || null,
        last_action: {
          type: status === 'approved' ? 'approve' : 'reject',
          date: now,
          admin: user.email
        },
        updated_at: now
      };

      console.log('Attempting update:', {
        id,
        updateData,
        timestamp: now,
        userRole,
        userId: user.id
      });

      // Perform update matching only by id
      const { data: updateResult, error: updateError } = await supabase
        .from('films')
        .update(updateData)
        .eq('id', id)
        .select();

      console.log('Update response:', {
        success: !updateError,
        error: updateError,
        result: updateResult,
        id,
        timestamp: now
      });

      if (updateError) {
        console.error('Error updating film:', {
          error: updateError,
          id,
          timestamp: now,
          userRole,
          userId: user.id
        });
        throw new Error(`Failed to update film: ${updateError.message}`);
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('No rows updated:', {
          id,
          timestamp: now,
          userRole,
          userId: user.id
        });
        throw new Error('No rows were updated');
      }

      // Wait a short moment to ensure the update is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the update was successful
      const { data: updatedFilm, error: verifyError } = await supabase
        .from('films')
        .select('*')
        .eq('id', id)
        .single();

      if (verifyError) {
        console.error('Error verifying update:', {
          error: verifyError,
          id,
          timestamp: now,
          userRole,
          userId: user.id
        });
        throw new Error(`Failed to verify update: ${verifyError.message}`);
      }

      if (!updatedFilm) {
        console.error('Film not found after update:', { 
          id,
          timestamp: now,
          userRole,
          userId: user.id
        });
        throw new Error(`Film with ID ${id} not found after update`);
      }

      console.log('Update verification:', {
        id: updatedFilm.id,
        oldStatus: existingFilm.status,
        newStatus: updatedFilm.status,
        oldTimestamp: existingFilm.updated_at,
        newTimestamp: updatedFilm.updated_at,
        userRole,
        userId: user.id
      });

      // Verify the status was actually updated
      if (updatedFilm.status !== status) {
        console.error('Status mismatch after update:', {
          expected: status,
          actual: updatedFilm.status,
          oldTimestamp: existingFilm.updated_at,
          newTimestamp: updatedFilm.updated_at,
          userRole,
          userId: user.id,
          updateResult
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