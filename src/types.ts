export interface Film {
  id: string;
  title: string;
  filmmaker: string;
  description: string;
  price: number;
  views: number;
  revenue: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: string;
  videoUrl: string;
  rejectionNote?: string;
  lastAction?: {
    type: 'approve' | 'reject';
    admin: string;
    date: string;
  };
} 