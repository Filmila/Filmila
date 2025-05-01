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
        throw new Error(`Film with ID ${id} not found`);
      }

      console.log('Current film data:', existingFilm);

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

      // Function to attempt the update
      const attemptUpdate = async () => {
        // First verify we can access the film
        const { data: checkData, error: checkError } = await supabase
          .from('films')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking film access:', checkError);
          throw new Error(`Failed to access film: ${checkError.message}`);
        }

        if (!checkData) {
          console.error('Film not found or not accessible:', { id });
          throw new Error('Film not found or you do not have permission to access it');
        }

        console.log('Film is accessible:', { id, title: checkData.title, status: checkData.status });

        // First perform the update without selecting
        const { error: updateError } = await supabase
          .from('films')
          .update({ 
            status, 
            rejection_note,
            video_url: videoUrl,
            last_action: {
              type: status === 'approved' ? 'approve' : 'reject',
              date: new Date().toISOString()
            }
          })
          .eq('id', id);

        if (updateError) {
          console.error('Error updating film:', updateError);
          throw updateError;
        }

        // Then fetch the updated film
        const { data: updatedFilm, error: fetchError } = await supabase
          .from('films')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching updated film:', fetchError);
          throw new Error(`Failed to fetch updated film: ${fetchError.message}`);
        }

        if (!updatedFilm) {
          console.error('No film returned after update:', { id });
          // Even if we can't fetch the updated film, the update might have succeeded
          // Return the original film with the new status
          return {
            ...checkData,
            status,
            rejection_note,
            last_action: {
              type: status === 'approved' ? 'approve' : 'reject',
              date: new Date().toISOString()
            }
          };
        }

        return updatedFilm;
      };

      // Try the update with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let lastError;

      while (retryCount < maxRetries) {
        try {
          const updatedFilm = await attemptUpdate();
          
          console.log('Film status updated successfully:', {
            id: updatedFilm.id,
            title: updatedFilm.title,
            status: updatedFilm.status,
            last_action: updatedFilm.last_action
          });

          // Verify the status was actually updated
          if (updatedFilm.status !== status) {
            console.error('Status mismatch after update:', {
              expected: status,
              received: updatedFilm.status,
              film: updatedFilm
            });
            throw new Error('Film status was not updated correctly in the database');
          }

          return updatedFilm;
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          
          // If it's a JWT error, wait for token refresh
          if (error instanceof Error && error.message.includes('JWT')) {
            console.log('JWT error detected, waiting for token refresh...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            retryCount++;
            continue;
          }

          // If it's an RLS error, wait and retry
          if (error instanceof Error && (
            error.message.includes('permission') || 
            error.message.includes('not found') ||
            error.message.includes('not accessible')
          )) {
            console.log('Possible RLS issue detected, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
            continue;
          }
          
          // For other errors, throw immediately
          throw error;
        }
      }

      // If we've exhausted all retries, throw the last error
      throw lastError || new Error('Failed to update film after multiple attempts');
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