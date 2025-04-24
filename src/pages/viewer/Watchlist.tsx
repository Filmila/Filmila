import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Film } from '../../types';
import toast from 'react-hot-toast';

interface WatchlistItem {
  film: Film;
  added_at: string;
}

const Watchlist = () => {
  const { user } = useAuth();
  const [films, setFilms] = useState<WatchlistItem[]>([]);
  const [sortOption, setSortOption] = useState<'recent' | 'title'>('recent');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select(`
            film_id,
            added_at,
            films (*)
          `)
          .eq('viewer_id', user?.id)
          .order('added_at', { ascending: false });

        if (error) throw error;

        setFilms(
          data?.map(item => ({
            film: item.films as unknown as Film,
            added_at: item.added_at
          })) || []
        );
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchWatchlist();
    }
  }, [user?.id]);

  const handleRemoveFromWatchlist = async (filmId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('viewer_id', user?.id)
        .eq('film_id', filmId);

      if (error) throw error;

      setFilms(prev => prev.filter(item => item.film.id !== filmId));
      toast.success('Film removed from watchlist');
    } catch (error) {
      console.error('Error removing film from watchlist:', error);
      toast.error('Failed to remove film from watchlist');
    }
  };

  const sortedFilms = [...films].sort((a, b) => {
    switch (sortOption) {
      case 'recent':
        return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
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
        <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as 'recent' | 'title')}
          className="rounded-md border-gray-300 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="recent">Recently Added</option>
          <option value="title">By Title</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedFilms.map(({ film, added_at }) => (
          <div key={film.id} className="bg-white rounded-lg shadow p-4">
            <img
              src={film.thumbnail_url || '/placeholder.jpg'}
              alt={film.title}
              className="w-full h-40 object-cover rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900">{film.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Added on {new Date(added_at).toLocaleDateString()}
            </p>
            <div className="flex items-center justify-between">
              <Link
                to={`/watch/${film.id}`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Watch Now
              </Link>
              <button
                onClick={() => handleRemoveFromWatchlist(film.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedFilms.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your watchlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add films to your watchlist to watch them later.
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

export default Watchlist; 