import { supabase } from '../config/supabase';

export interface FilmRating {
  id: string;
  film_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export const ratingService = {
  async rateFilm(filmId: string, rating: number): Promise<FilmRating> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user has already rated this film
    const { data: existingRating } = await supabase
      .from('film_ratings')
      .select('*')
      .eq('film_id', filmId)
      .eq('user_id', user.id)
      .single();

    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from('film_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existingRating.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from('film_ratings')
        .insert([{
          film_id: filmId,
          user_id: user.id,
          rating
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async getUserRating(filmId: string): Promise<number | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('film_ratings')
      .select('rating')
      .eq('film_id', filmId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rating found
        return null;
      }
      throw error;
    }

    return data.rating;
  },

  async getFilmRatings(filmId: string): Promise<FilmRating[]> {
    const { data, error } = await supabase
      .from('film_ratings')
      .select('*')
      .eq('film_id', filmId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}; 