import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film } from '../types';
import { supabase } from '../config/supabase';
import { StarIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const [featuredFilms, setFeaturedFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchFeaturedFilms = async () => {
      try {
        const { data, error } = await supabase
          .from('films')
          .select('*')
          .eq('status', 'approved')
          .order('upload_date', { ascending: false })
          .limit(6);

        if (error) throw error;
        setFeaturedFilms(data || []);
      } catch (error) {
        console.error('Error fetching featured films:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedFilms();
  }, []);

  const FilmCard = ({ film }: { film: Film }) => (
    <div className="group relative bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
      <div className="relative h-48">
        <img
          src={film.thumbnail_url || '/placeholder.jpg'}
          alt={film.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link
            to={`/watch/${film.id}`}
            className="bg-orange-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-orange-700 transition-colors"
          >
            <PlayIcon className="h-5 w-5" />
            <span>Watch Now</span>
          </Link>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{film.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-600">N/A</span>
          </div>
          <button className="text-purple-600 hover:text-purple-800">
            <BookmarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-purple-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-purple-600 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('welcome')}
            </h1>
            <p className="text-xl mb-8 text-purple-100">
              {t('joinCommunity')}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-purple-600 px-8 py-3 rounded-full hover:bg-gray-100 transition-colors font-semibold text-lg shadow"
              >
                {t('getStarted')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Films Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Films</h2>
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredFilms.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home; 