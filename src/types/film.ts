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
  thumbnail_url?: string;
  genre: 'Drama' | 'Comedy' | 'Action' | 'Romance' | 'Thriller' | 'Documentary' | 'Horror' | 'Sci-Fi' | 'Animation' | 'Other';
  version: number;
} 