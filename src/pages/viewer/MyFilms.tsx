import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Film } from '../../types';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface WatchedFilm {
  film: Film;
  watched_at: string;
  rating?: number;
}

const MyFilms = () => {
  const { user } = useAuth();
  const [watchedFilms, setWatchedFilms] = useState<WatchedFilm[]>([]);
  const [sortOption, setSortOption] = useState<'recent' | 'rating' | 'title'>('recent');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWatchedFilms = async () => {
      try {
        const { data: watched, error: watchedError } = await supabase
          .from('watched_films')
          .select(`
            film_id,
            watched_at,
            films (*),
            film_ratings (rating)
          `)
          .eq('viewer_id', user?.id)
          .order('watched_at', { ascending: false });

        if (watchedError) throw watchedError;

        const watchedWithRatings = watched?.map(w => ({
          film: w.films as unknown as Film,
          watched_at: w.watched_at,
          rating: w.film_ratings?.[0]?.rating
        })) || [];

        setWatchedFilms(watchedWithRatings);
      } catch (error) {
        console.error('Error fetching watched films:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchWatchedFilms();
    }
  }, [user?.id]);

  const handleRating = async (filmId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('film_ratings')
        .upsert({
          viewer_id: user?.id,
          film_id: filmId,
          rating,
          rated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setWatchedFilms(prev => {
        return prev.map(w => {
          if (w.film.id === filmId) {
            return { ...w, rating };
          }
          return w;
        });
      });
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const sortedFilms = [...watchedFilms].sort((a, b) => {
    switch (sortOption) {
      case 'recent':
        return new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime();
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'title':
        return a.film.title.localeCompare(b.film.title);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Films</h1>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as 'recent' | 'rating' | 'title')}
          className="rounded-md border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="recent">Recently Watched</option>
          <option value="rating">By Rating</option>
          <option value="title">By Title</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedFilms.map(({ film, watched_at, rating }) => (
          <div key={film.id} className="bg-white rounded-lg shadow p-4">
            <img
              src={film.thumbnail_url || '/placeholder.jpg'}
              alt={film.title}
              className="w-full h-40 object-cover rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900">{film.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Watched on {new Date(watched_at).toLocaleDateString()}
            </p>
            <div className="flex items-center justify-between">
              <Link
                to={`/watch/${film.id}`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Watch Again
              </Link>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(film.id, star)}
                    className="text-yellow-400 hover:text-yellow-500"
                  >
                    {star <= (rating || 0) ? (
                      <StarSolid className="h-5 w-5" />
                    ) : (
                      <StarOutline className="h-5 w-5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedFilms.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No films watched yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start watching films to build your history.
          </p>
          <div className="mt-6">
            <Link
              to="/viewer/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Films
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFilms; 