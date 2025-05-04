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
    const MAX_RETRIES = 3;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        console.log(`Update attempt ${retryCount + 1}/${MAX_RETRIES}:`, { id, status, rejection_note });

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

        // Get current film data including version
        const { data: currentFilm, error: fetchError } = await supabase
          .from('films')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching current film:', {
            error: fetchError,
            id,
            retryCount
          });
          throw new Error(`Failed to fetch film: ${fetchError.message}`);
        }

        if (!currentFilm) {
          console.error('Film not found:', { id, retryCount });
          throw new Error(`Film with ID ${id} not found`);
        }

        console.log('Current film state:', {
          id: currentFilm.id,
          version: currentFilm.version,
          status: currentFilm.status,
          updated_at: currentFilm.updated_at,
          retryCount
        });

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

        console.log('Attempting update:', {
          id,
          currentVersion: currentFilm.version,
          updateData,
          retryCount,
          userRole,
          userId: user.id
        });

        // Perform the update with version check
        const { error: updateError } = await supabase
          .from('films')
          .update(updateData)
          .eq('id', id)
          .eq('version', Number(currentFilm.version));

        console.log('Update result:', {
          success: !updateError,
          error: updateError,
          id,
          currentVersion: currentFilm.version,
          retryCount
        });

        if (updateError) {
          console.error('Error updating film:', {
            error: updateError,
            id,
            currentVersion: currentFilm.version,
            retryCount,
            userRole,
            userId: user.id
          });
          
          // If it's a version conflict, retry
          if (updateError.code === 'PGRST116') {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
              console.log('Version conflict, retrying...', {
                id,
                retryCount,
                currentVersion: currentFilm.version
              });
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
              continue;
            }
          }
          throw updateError;
        }

        // Verify the update was successful
        const { data: updatedFilm, error: verifyError } = await supabase
          .from('films')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (verifyError) {
          console.error('Error verifying update:', {
            error: verifyError,
            id,
            retryCount,
            userRole,
            userId: user.id
          });
          throw new Error(`Failed to verify update: ${verifyError.message}`);
        }

        if (!updatedFilm) {
          console.error('Film not found after update:', {
            id,
            retryCount,
            userRole,
            userId: user.id
          });
          throw new Error(`Film with ID ${id} not found after update`);
        }

        console.log('Update verification:', {
          id: updatedFilm.id,
          oldStatus: currentFilm.status,
          newStatus: updatedFilm.status,
          oldVersion: currentFilm.version,
          newVersion: updatedFilm.version,
          updated_at: updatedFilm.updated_at,
          retryCount,
          userRole,
          userId: user.id
        });

        // Verify the status was actually updated
        if (updatedFilm.status !== status) {
          console.error('Status mismatch after update:', {
            expected: status,
            actual: updatedFilm.status,
            oldVersion: currentFilm.version,
            newVersion: updatedFilm.version,
            updated_at: updatedFilm.updated_at,
            retryCount,
            userRole,
            userId: user.id
          });
          
          // If we haven't exceeded retries, try again
          if (retryCount < MAX_RETRIES - 1) {
            retryCount++;
            console.log('Status mismatch, retrying...', {
              id,
              retryCount,
              expected: status,
              actual: updatedFilm.status,
              userRole,
              userId: user.id
            });
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            continue;
          }
          
          throw new Error('Film status was not updated correctly after multiple attempts');
        }

        return updatedFilm;
      } catch (error) {
        console.error(`Error in update attempt ${retryCount + 1}:`, error);
        if (retryCount >= MAX_RETRIES - 1) {
          throw error;
        }
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }

    throw new Error(`Failed to update film status after ${MAX_RETRIES} attempts`);
  },

  async deleteFilm(id: string): Promise<void> {
    const { error } = await supabase
      .from('films')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 