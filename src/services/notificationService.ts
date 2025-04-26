import { supabase } from '../config/supabase';

export type NotificationType = 'FILM_APPROVED' | 'FILM_REJECTED' | 'NEW_FILM_SUBMISSION';

export interface NotificationMetadata {
  filmTitle?: string;
  message?: string;
  [key: string]: any;
}

export interface Notification {
  recipient_id: string;
  type: NotificationType;
  metadata: NotificationMetadata;
  created_at: string;
  read: boolean;
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
      // Decode email if it contains encoded characters
      const decodedEmail = decodeURIComponent(email).toLowerCase();
      console.log(`Looking up user ID for email: ${decodedEmail}`);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', decodedEmail)
        .limit(1);

      if (error) {
        console.error('Error fetching user ID:', error);
        throw error;
      }

      if (!profiles || profiles.length === 0) {
        console.warn(`No profile found for email: ${decodedEmail}`);
        return null;
      }

      return profiles[0].id;
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
  },

  async sendNotification(email: string, type: NotificationType, metadata: NotificationMetadata) {
    try {
      const userId = await this.getUserIdByEmail(email);
      if (!userId) {
        console.error(`No user found for email: ${email}`);
        return;
      }

      const notification: Notification = {
        recipient_id: userId,
        type,
        metadata,
        created_at: new Date().toISOString(),
        read: false
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) {
        console.error('Error sending notification:', error);
        return;
      }

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  }
};

export default notificationService; 