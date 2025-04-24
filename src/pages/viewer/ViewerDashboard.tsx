import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Film } from '../../types';

const ViewerDashboard = () => {
  const { user } = useAuth();
  const [watchedFilms, setWatchedFilms] = useState<Film[]>([]);
  const [favoriteFilms, setFavoriteFilms] = useState<Film[]>([]);
  const [recommendedFilms, setRecommendedFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        // Fetch watched films
        const { data: watched, error: watchedError } = await supabase
          .from('watched_films')
          .select('film_id, films(*)')
          .eq('viewer_id', user?.id)
          .order('watched_at', { ascending: false });

        if (watchedError) throw watchedError;
        setWatchedFilms(watched?.map(w => w.films) || []);

        // Fetch favorite films
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorite_films')
          .select('film_id, films(*)')
          .eq('viewer_id', user?.id)
          .order('created_at', { ascending: false });

        if (favoritesError) throw favoritesError;
        setFavoriteFilms(favorites?.map(f => f.films) || []);

        // Fetch recommended films (based on watched and favorites)
        const { data: recommended, error: recommendedError } = await supabase
          .from('films')
          .select('*')
          .eq('status', 'approved')
          .limit(5);

        if (recommendedError) throw recommendedError;
        setRecommendedFilms(recommended || []);

      } catch (error) {
        console.error('Error fetching films:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchFilms();
    }
  }, [user?.id]);

  const FilmCard = ({ film }: { film: Film }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <img
        src={film.thumbnail_url || '/placeholder.jpg'}
        alt={film.title}
        className="w-full h-40 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-900">{film.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{film.description}</p>
      <Link
        to={`/watch/${film.id}`}
        className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Watch Now
      </Link>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome back, {user?.email}!
          </h2>
        </div>
      </div>

      {/* Recommended Films */}
      <section className="mb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommended for You</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendedFilms.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </section>

      {/* Recently Watched */}
      <section className="mb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recently Watched</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchedFilms.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </section>

      {/* Favorites */}
      <section>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Favorites</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteFilms.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ViewerDashboard; 