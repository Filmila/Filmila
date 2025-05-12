import { supabase } from '../config/supabase';

export interface Comment {
  id: string;
  film_id: string;
  viewer_id: string;
  comment: string;
  created_at: string;
}

export const commentService = {
  async getComments(filmId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('film_id', filmId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addComment(filmId: string, comment: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is a viewer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'VIEWER') {
      throw new Error('Only viewers can post comments');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        film_id: filmId,
        viewer_id: user.id,
        comment
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }
}; 