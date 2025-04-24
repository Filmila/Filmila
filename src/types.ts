export interface Film {
  id: string;
  title: string;
  filmmaker: string;
  description: string;
  price?: number;
  views: number;
  revenue: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_note?: string;
  upload_date: string;
  video_url: string;
  thumbnail_url?: string;
  last_action?: {
    type: 'approve' | 'reject';
    admin: string;
    date: string;
  };
} 