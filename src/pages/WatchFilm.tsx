import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film } from '../types/index';
import { supabase } from '../config/supabase';
import { paymentService } from '../services/paymentService';
import { commentService, Comment } from '../services/commentService';
import { stripePromise } from '../config/stripe';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FilmRating from '../components/FilmRating';
import { useAuth } from '../context/AuthContext';

interface FilmWithFilmmaker extends Film {
  filmmaker_display_name?: string;
  profile?: {
    display_name?: string;
  };
}

interface CommentWithProfile extends Comment {
  display_name?: string;
}

const WatchFilm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [film, setFilm] = useState<FilmWithFilmmaker | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTracked = useRef(false);
  const [profile, setProfile] = useState<{ display_name?: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setCurrentUserId(user?.id || null);
    };
    checkAuth();
  }, []);

  // Helper to fetch comments with display names
  async function fetchCommentsWithDisplayNames(filmId: string) {
    // 1. Fetch comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('film_id', filmId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!comments || comments.length === 0) return [];

    // 2. Get unique viewer_ids
    const viewerIds = [...new Set(comments.map(c => c.viewer_id))];

    // 3. Fetch all profiles for those viewer_ids
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', viewerIds);
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.display_name; });

    // 4. Attach display_name to each comment
    return comments.map(c => ({
      ...c,
      display_name: profileMap[c.viewer_id] || 'Unknown',
    }));
  }

  useEffect(() => {
    const fetchFilm = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        // Fetch film
        const { data: filmData, error: filmError } = await supabase
          .from('films')
          .select('*')
          .eq('id', id)
          .single();

        if (filmError || !filmData) {
          toast.error('Failed to load film');
          navigate('/');
          return;
        }

        setFilm(filmData);

        // Fetch display_name using filmmaker email
        if (filmData.filmmaker) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('email', filmData.filmmaker)
            .single();

          console.log('Profile fetched:', profileData, 'Error:', profileError);

          setProfile(profileData);
        } else {
          setProfile(null);
        }

        // Check if user has access
        const access = await paymentService.hasAccessToFilm(id);
        setHasAccess(access);

        // Fetch comments with display names
        const commentsWithNames = await fetchCommentsWithDisplayNames(id);
        setComments(commentsWithNames);
      } catch (error) {
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
      toast.error(t('watchFilm.errors.loginRequired'));
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
      toast.error(t('watchFilm.errors.paymentFailed'));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await commentService.addComment(id, newComment.trim());
      // Re-fetch comments after posting
      const commentsWithNames = await fetchCommentsWithDisplayNames(id);
      setComments(commentsWithNames);
      setNewComment('');
      toast.success(t('watchFilm.success.commentAdded'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('watchFilm.errors.commentFailed'));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success(t('watchFilm.success.commentDeleted'));
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(t('watchFilm.errors.deleteCommentFailed'));
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
            toast.success(t('watchFilm.success.payment'));
            // Remove session_id from URL
            window.history.replaceState({}, document.title, `/watch/${id}`);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error(t('watchFilm.errors.paymentVerificationFailed'));
        }
      };

      verifyPayment();
    }
  }, [id, t]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">{t('watchFilm.loading')}</div>;
  }

  if (!film) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="aspect-video bg-black mb-4">
        {hasAccess ? (
          <video
            ref={videoRef}
            src={film.video_url}
            controls
            className="w-full h-full"
            onPlay={trackView}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={film.thumbnail_url}
              alt={film.title}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute text-center">
              <h2 className="text-2xl font-bold text-white mb-4">{film.title}</h2>
              <p className="text-white mb-4">{t('watchFilm.payment.price', { price: film.price })}</p>
              <button
                onClick={handlePayment}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                {t('watchFilm.payment.purchase')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold mb-2">{film.title}</h1>
          <div className="flex items-center gap-4 text-gray-600 mb-4">
            <span>{t('watchFilm.filmInfo.by')} {profile?.display_name || film.filmmaker}</span>
            <span>•</span>
            <span>{t('watchFilm.filmInfo.views', { count: film.views || 0 })}</span>
            <span>•</span>
            <span>{t('watchFilm.filmInfo.genre')}: {t(film.genre.toLowerCase())}</span>
          </div>
          {/* Film Rating Component */}
          {user && user.profile?.role === 'VIEWER' && (
            <div className="mb-4">
              <FilmRating filmId={film.id} averageRating={film.average_rating || 0} />
            </div>
          )}
          <p className="text-gray-700 mb-6">{film.description}</p>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">{t('watchFilm.comments.title')}</h2>
            {isAuthenticated && (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('watchFilm.comments.placeholder')}
                  className="w-full p-2 border rounded-md mb-2"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('watchFilm.comments.submit')}
                </button>
              </form>
            )}

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{comment.display_name || t('watchFilm.comments.unknownUser')}</span>
                    {currentUserId === comment.viewer_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        {t('watchFilm.comments.delete')}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchFilm; 