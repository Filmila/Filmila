export interface Film {
  id: string;
  title: string;
  description: string;
  filmmaker: string;
  upload_date: string;
  status: 'pending' | 'approved' | 'rejected';
  views: number;
  revenue: number;
  thumbnail_url?: string;
  video_url: string;
  rejection_note?: string;
  genre: 'Drama' | 'Comedy' | 'Action' | 'Romance' | 'Thriller' | 'Documentary' | 'Horror' | 'Sci-Fi' | 'Animation' | 'Other';
  last_action?: {
    type: 'approve' | 'reject';
    admin: string;
    date: string;
  };
}

export interface FilmProgress {
  film: Film;
  progress: number;
  last_watched: string;
}

export interface RatedFilm {
  film: Film;
  rating: number;
  rated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'FILMMAKER' | 'VIEWER';
  display_name?: string;
} 