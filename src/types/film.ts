export interface Film {
  id: string;
  title: string;
  filmmaker: string;
  description: string;
  price: number;
  views: number;
  revenue: number;
  status: 'pending' | 'approved' | 'rejected';
  upload_date: string;
  video_url: string;
  version: number;
} 