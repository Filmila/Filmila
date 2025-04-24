import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Film } from '../../types';

interface FilmProgress {
  film: Film;
  progress: number;
  last_watched: string;
}

const ContinueWatching = () => {
  const { user } = useAuth();
  const [films, setFilms] = useState<FilmProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInProgressFilms = async () => {
      try {
        const { data, error } = await supabase
          .from('film_progress')
          .select(`
            film_id,
            progress,
            last_watched,
            films (*)
          `)
          .eq('viewer_id', user?.id)
          .lt('progress', 100)
          .order('last_watched', { ascending: false });

        if (error) throw error;

        setFilms(
          data?.map(item => ({
            film: item.films as unknown as Film,
            progress: item.progress,
            last_watched: item.last_watched
          })) || []
        );
      } catch (error) {
        console.error('Error fetching in-progress films:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchInProgressFilms();
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Continue Watching</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {films.map(({ film, progress, last_watched }) => (
          <div key={film.id} className="bg-white rounded-lg shadow p-4">
            <div className="relative">
              <img
                src={film.thumbnail_url || '/placeholder.jpg'}
                alt={film.title}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <div className="absolute bottom-4 left-0 right-0 h-1 bg-gray-200">
                <div
                  className="h-full bg-indigo-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{film.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
              Last watched on {new Date(last_watched).toLocaleDateString()}
            </p>
            <div className="flex items-center justify-between">
              <Link
                to={`/watch/${film.id}`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Continue Watching
              </Link>
              <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
            </div>
          </div>
        ))}
      </div>

      {films.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No films in progress</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start watching a film to see it here.
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

export default ContinueWatching; 