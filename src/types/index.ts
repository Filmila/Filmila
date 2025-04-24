export interface Film {
  id: string;
  title: string;
  description: string;
  filmmaker: string;
  status: 'pending' | 'approved' | 'rejected';
  views: number;
  revenue: number;
  upload_date: string;
  video_url: string;
  thumbnail_url: string;
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'FILMMAKER' | 'VIEWER';
  display_name?: string;
} 