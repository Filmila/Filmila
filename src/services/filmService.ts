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

      // Update the film with the new status and cleaned video URL
      const { data, error } = await supabase
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
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating film status:', error);
        if (error.code === 'PGRST116') {
          // If no rows were found, try to update without the select
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
            throw new Error(`Failed to update film status: ${updateError.message}`);
          }

          // If update succeeded, fetch the updated film
          const { data: updatedFilm, error: fetchError } = await supabase
            .from('films')
            .select('*')
            .eq('id', id)
            .single();

          if (fetchError) {
            throw new Error(`Failed to fetch updated film: ${fetchError.message}`);
          }

          return updatedFilm;
        }
        throw new Error(`Failed to update film status: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after update');
      }

      console.log('Film status updated successfully:', data);
      return data;
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