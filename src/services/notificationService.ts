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
      
      // First try to get the user from auth.users
      const { data: userData, error: userError } = await supabase.auth
        .admin.listUsers();

      if (userError) {
        console.error('Error fetching users:', userError);
        throw userError;
      }

      const user = userData.users.find(u => u.email === email);
      if (!user) {
        console.error('No user found in auth.users with email:', email);
        return null;
      }

      // Now verify the profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: email,
              role: 'FILMMAKER' // Default role for existing users
            }])
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
          return newProfile.id;
        }
        throw profileError;
      }

      return profileData.id;
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