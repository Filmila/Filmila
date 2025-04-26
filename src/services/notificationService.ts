import { supabase } from '../config/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  created_at: string;
}

export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notification,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getUnreadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      console.log('Fetching user ID for email:', email);
      
      // Get the user profile directly from the profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.error('No profile found for email:', email);
          return null;
        }
        throw error;
      }

      return profile.id;
    } catch (error) {
      console.error('Error in getUserIdByEmail:', error);
      throw error;
    }
  },

  async sendFilmApprovalNotification(filmTitle: string, userEmail: string) {
    try {
      const userId = await this.getUserIdByEmail(userEmail);
      if (!userId) {
        throw new Error(`Could not find user ID for email: ${userEmail}`);
      }

      return this.createNotification({
        user_id: userId,
        title: 'Film Approved',
        message: `Your film "${filmTitle}" has been approved and is now available for viewing.`,
        type: 'success',
        read: false
      });
    } catch (error) {
      console.error('Error sending approval notification:', error);
      throw error;
    }
  },

  async sendFilmRejectionNotification(filmTitle: string, userEmail: string, rejectionNote: string) {
    try {
      const userId = await this.getUserIdByEmail(userEmail);
      if (!userId) {
        throw new Error(`Could not find user ID for email: ${userEmail}`);
      }

      return this.createNotification({
        user_id: userId,
        title: 'Film Rejected',
        message: `Your film "${filmTitle}" was not approved. Reason: ${rejectionNote}`,
        type: 'error',
        read: false
      });
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      throw error;
    }
  }
};

export default notificationService; 