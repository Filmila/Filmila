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
    // First get the current version
    const { data: currentFilm, error: fetchError } = await supabase
      .from('films')
      .select('version')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update the film with the new status and increment version
    const { data, error } = await supabase
      .from('films')
      .update({ 
        status, 
        rejection_note,
        version: currentFilm.version + 1,
        last_action: {
          type: status === 'approved' ? 'approve' : 'reject',
          date: new Date().toISOString()
        }
      })
      .eq('id', id)
      .eq('version', currentFilm.version) // Ensure we're updating the correct version
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Version conflict detected. Please refresh and try again.');
      }
      throw error;
    }

    return data;
  },

  async deleteFilm(id: string): Promise<void> {
    const { error } = await supabase
      .from('films')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 