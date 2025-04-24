import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Film } from '../../types';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface FilmProgress {
  film: Film;
  progress: number;
  last_watched: string;
}

interface RatedFilm {
  film: Film;
  rating: number;
  rated_at: string;
}

const ViewerDashboard = () => {
  const { user } = useAuth();
  const [watchedFilms, setWatchedFilms] = useState<Film[]>([]);
  const [recommendedFilms, setRecommendedFilms] = useState<Film[]>([]);
  const [continueWatching, setContinueWatching] = useState<FilmProgress[]>([]);
  const [ratedFilms, setRatedFilms] = useState<RatedFilm[]>([]);
  const [watchlist, setWatchlist] = useState<Film[]>([]);
  const [featuredFilm, setFeaturedFilm] = useState<Film | null>(null);
  const [sortOption, setSortOption] = useState<'recent' | 'rating' | 'genre'>('recent');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch watched films
        const { data: watched, error: watchedError } = await supabase
          .from('watched_films')
          .select('film_id, films(*)')
          .eq('viewer_id', user?.id)
          .order('watched_at', { ascending: false });

        if (watchedError) throw watchedError;
        const watchedFilmsData = watched?.map(w => (w.films as unknown) as Film) || [];
        setWatchedFilms(watchedFilmsData);

        // Fetch films in progress
        const { data: progress, error: progressError } = await supabase
          .from('film_progress')
          .select('film_id, films(*), progress, last_watched')
          .eq('viewer_id', user?.id)
          .lt('progress', 100)
          .order('last_watched', { ascending: false });

        if (progressError) throw progressError;
        setContinueWatching(
          progress?.map(p => ({
            film: (p.films as unknown) as Film,
            progress: p.progress,
            last_watched: p.last_watched
          })) || []
        );

        // Fetch rated films
        const { data: rated, error: ratedError } = await supabase
          .from('film_ratings')
          .select('film_id, films(*), rating, rated_at')
          .eq('viewer_id', user?.id)
          .order('rated_at', { ascending: false });

        if (ratedError) throw ratedError;
        setRatedFilms(
          rated?.map(r => ({
            film: (r.films as unknown) as Film,
            rating: r.rating,
            rated_at: r.rated_at
          })) || []
        );

        // Fetch watchlist
        const { data: watchlistData, error: watchlistError } = await supabase
          .from('watchlist')
          .select('film_id, films(*)')
          .eq('viewer_id', user?.id)
          .order('added_at', { ascending: false });

        if (watchlistError) throw watchlistError;
        const watchlistFilmsData = watchlistData?.map(w => (w.films as unknown) as Film) || [];
        setWatchlist(watchlistFilmsData);

        // Fetch recommended films
        const { data: recommended, error: recommendedError } = await supabase
          .from('films')
          .select('*')
          .eq('status', 'approved')
          .limit(5);

        if (recommendedError) throw recommendedError;
        setRecommendedFilms(((recommended || []) as unknown) as Film[]);

        // Set featured film
        if (recommended && recommended.length > 0) {
          setFeaturedFilm((recommended[0] as unknown) as Film);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
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
      setRatedFilms(prev => {
        const updated = [...prev];
        const index = updated.findIndex(r => r.film.id === filmId);
        if (index !== -1) {
          updated[index] = { ...updated[index], rating };
        }
        return updated;
      });
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const handleWatchlistToggle = async (filmId: string) => {
    try {
      const isInWatchlist = watchlist.some(f => f.id === filmId);
      if (isInWatchlist) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('viewer_id', user?.id)
          .eq('film_id', filmId);
        setWatchlist(prev => prev.filter(f => f.id !== filmId));
      } else {
        await supabase
          .from('watchlist')
          .insert({
            viewer_id: user?.id,
            film_id: filmId,
            added_at: new Date().toISOString()
          });
        const film = recommendedFilms.find(f => f.id === filmId);
        if (film) {
          setWatchlist(prev => [film, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const FilmCard = ({ film, showRating = false, progress = 0 }: { film: Film, showRating?: boolean, progress?: number }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="relative">
        <img
          src={film.thumbnail_url || '/placeholder.jpg'}
          alt={film.title}
          className="w-full h-40 object-cover rounded-md mb-4"
        />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-indigo-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{film.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{film.description}</p>
      <div className="flex items-center justify-between">
        <Link
          to={`/watch/${film.id}`}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {progress > 0 ? 'Continue Watching' : 'Watch Now'}
        </Link>
        {showRating && (
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => {
              const rating = ratedFilms.find(r => r.film.id === film.id)?.rating || 0;
              return (
                <button
                  key={star}
                  onClick={() => handleRating(film.id, star)}
                  className="text-yellow-400 hover:text-yellow-500"
                >
                  {star <= rating ? (
                    <StarSolid className="h-5 w-5" />
                  ) : (
                    <StarOutline className="h-5 w-5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-12 -mt-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          {featuredFilm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Featured Film</h2>
                <h3 className="text-xl mb-4">{featuredFilm.title}</h3>
                <p className="text-gray-300 mb-6">{featuredFilm.description}</p>
                <div className="flex space-x-4">
                  <Link
                    to={`/watch/${featuredFilm.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Watch Now
                  </Link>
                  <button
                    onClick={() => handleWatchlistToggle(featuredFilm.id)}
                    className="inline-flex items-center px-4 py-2 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-gray-900"
                  >
                    {watchlist.some(f => f.id === featuredFilm.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>
              </div>
              <div>
                <img
                  src={featuredFilm.thumbnail_url || '/placeholder.jpg'}
                  alt={featuredFilm.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Continue Watching</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {continueWatching.map(({ film, progress }) => (
              <FilmCard key={film.id} film={film} progress={progress} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Films */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendedFilms.map((film) => (
            <FilmCard key={film.id} film={film} showRating />
          ))}
        </div>
      </section>

      {/* Watched Films */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Watch History</h2>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'recent' | 'rating' | 'genre')}
            className="rounded-md border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="recent">Recently Watched</option>
            <option value="rating">By Rating</option>
            <option value="genre">By Genre</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchedFilms.map((film) => (
            <FilmCard key={film.id} film={film} showRating />
          ))}
        </div>
      </section>

      {/* My Ratings */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Ratings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ratedFilms.map(({ film }) => (
            <FilmCard key={film.id} film={film} showRating />
          ))}
        </div>
      </section>

      {/* Watchlist */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Watchlist</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlist.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ViewerDashboard; 