import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Film } from '../types/index';
import { supabase } from '../config/supabase';
import { paymentService } from '../services/paymentService';
import { stripePromise } from '../config/stripe';
import { toast } from 'react-hot-toast';

const WatchFilm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<Film | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
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

        setFilm(filmData);

        // Check if user has access
        const access = await paymentService.hasAccessToFilm(id);
        setHasAccess(access);
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
              <p className="text-sm text-gray-500">Filmmaker: {film.filmmaker}</p>
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
          src={film.video_url}
          controls
          className="w-full h-full rounded-lg"
          poster={film.thumbnail_url}
        />
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">{film.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>Filmmaker: {film.filmmaker}</p>
          <p>Genre: {film.genre}</p>
        </div>
      </div>
    </div>
  );
};

export default WatchFilm; 