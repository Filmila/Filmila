import { supabase } from '../config/supabase';
import { Film } from '../types';

export const filmService = {
  async createFilm(film: Omit<Film, 'id'>): Promise<Film> {
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
        upload_date: film.upload_date,
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
      // First verify the film exists
      const { data: existingFilm, error: checkError } = await supabase
        .from('films')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError || !existingFilm) {
        throw new Error('Film not found');
      }

      // Update the film with the new status
      const { data, error } = await supabase
        .from('films')
        .update({ 
          status, 
          rejection_note,
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
        throw error;
      }

      if (!data) {
        throw new Error('Failed to update film status');
      }

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