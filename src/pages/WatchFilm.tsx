import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film } from '../types/index';
import { supabase } from '../config/supabase';
import { paymentService } from '../services/paymentService';
import { commentService, Comment } from '../services/commentService';
import { stripePromise } from '../config/stripe';
import { toast } from 'react-hot-toast';

interface FilmWithFilmmaker extends Film {
  filmmaker_display_name?: string;
}

const WatchFilm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<FilmWithFilmmaker | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTracked = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setCurrentUserId(user?.id || null);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchFilm = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        // Fetch film details
        const { data: filmData, error: filmError } = await supabase
          .from('films')
          .select('*')
          .eq('id', id)
          .single();

        if (filmError) {
          console.error('Error fetching film:', filmError);
          toast.error('Failed to load film');
          navigate('/');
          return;
        }

        // Fetch filmmaker's display name
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('email', filmData.filmmaker)
          .single();

        if (profileError) {
          console.error('Error fetching filmmaker profile:', profileError);
        }

        setFilm({
          ...filmData,
          filmmaker_display_name: profileData?.display_name
        });

        // Check if user has access
        const access = await paymentService.hasAccessToFilm(id);
        setHasAccess(access);

        // Fetch comments
        const comments = await commentService.getComments(id);
        setComments(comments);
      } catch (error) {
        console.error('Error fetching film:', error);
        toast.error('Failed to load film');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilm();
  }, [id, navigate]);

  const handlePayment = async () => {
    if (!film || !id) return;

    if (!isAuthenticated) {
      toast.error('Please log in to purchase access');
      navigate('/login', { state: { from: `/watch/${id}` } });
      return;
    }

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const session = await paymentService.createPaymentSession(
        id,
        film.price,
        `${window.location.origin}/watch/${id}?session_id={CHECKOUT_SESSION_ID}`,
        `${window.location.origin}/watch/${id}`
      );

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await commentService.addComment(id, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const trackView = async () => {
    if (!id || !film || viewTracked.current) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Don't track views for filmmakers
    if (film.filmmaker === user.email) return;

    // Check if user has paid for the film
    const hasPaid = await paymentService.hasAccessToFilm(id);
    if (!hasPaid) return;

    try {
      console.log('Incrementing views for film:', id);
      const { data, error } = await supabase
        .from('films')
        .update({ views: (film.views || 0) + 1 })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating views:', error);
        throw error;
      }

      console.log('Views updated successfully:', data);
      viewTracked.current = true;
      // Update the local film state with new views count
      setFilm(prev => prev ? { ...prev, views: data.views } : null);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  useEffect(() => {
    // Check for payment success
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get('session_id');

    if (sessionId) {
      const verifyPayment = async () => {
        try {
          const success = await paymentService.verifyPayment(sessionId);
          if (success) {
            setHasAccess(true);
            toast.success('Payment successful! You now have access to the film.');
            // Remove session_id from URL
            window.history.replaceState({}, document.title, `/watch/${id}`);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Failed to verify payment');
        }
      };

      verifyPayment();
    }
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!film) {
    return <div className="flex justify-center items-center min-h-screen">Film not found</div>;
  }

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">{film.title}</h1>
          <p className="text-gray-600 mb-4">{film.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Price: ${film.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                Filmmaker: {film.filmmaker_display_name || film.filmmaker}
              </p>
            </div>
            <button
              onClick={handlePayment}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isAuthenticated ? 'Purchase Access' : 'Log in to Purchase'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{film.title}</h1>
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <video
          ref={videoRef}
          src={film.video_url}
          controls
          className="w-full h-full rounded-lg"
          poster={film.thumbnail_url}
          onPlay={() => trackView()}
        />
      </div>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <p className="text-gray-600 mb-4">{film.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>Filmmaker: {film.filmmaker_display_name || film.filmmaker}</p>
          <p>Genre: {film.genre}</p>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        
        {/* Comment Form */}
        {isAuthenticated && (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-md mb-2"
              rows={3}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex justify-between items-start">
                <p className="text-gray-800">{comment.comment}</p>
                {isAuthenticated && comment.viewer_id === currentUserId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-gray-500 text-center">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchFilm; 