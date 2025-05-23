import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Film } from '../../types';
import { CheckIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const FilmmakerDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Separate films by status
  const approvedFilms = films.filter(film => film.status === 'approved');
  const pendingFilms = films.filter(film => film.status === 'pending');
  const rejectedFilms = films.filter(film => film.status === 'rejected');

  // Monitor films state changes
  useEffect(() => {
    console.log('Films state updated:', {
      totalFilms: films.length,
      approvedCount: approvedFilms.length,
      pendingCount: pendingFilms.length,
      rejectedCount: rejectedFilms.length,
      films: films.map(f => ({ id: f.id, title: f.title, status: f.status }))
    });
  }, [films, approvedFilms.length, pendingFilms.length, rejectedFilms.length]);

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        console.log('Fetching films for filmmaker:', user?.email);
        const { data, error } = await supabase
          .from('films')
          .select('*')
          .eq('filmmaker', user?.email)
          .order('upload_date', { ascending: false });

        if (error) {
          console.error('Error fetching films:', error);
          throw error;
        }

        console.log('Fetched films:', data?.map(f => ({ id: f.id, title: f.title, status: f.status })));
        setFilms(data || []);
      } catch (error) {
        console.error('Error fetching films:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    if (user?.email) {
      fetchFilms();

      console.log('Setting up real-time subscription for filmmaker:', user.email);
      
      // Subscribe to changes
      const subscription = supabase
        .channel('films-channel')
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'films',
            filter: `filmmaker=eq.${user.email}`
          },
          async (payload: { 
            eventType: 'INSERT' | 'UPDATE' | 'DELETE',
            old: Film | null,
            new: Film | null
          }) => {
            console.log('Received real-time update:', {
              eventType: payload.eventType,
              old: payload.old,
              new: payload.new,
              filmmaker: user.email
            });

            // Immediately update the films state with the new data
            if (payload.eventType === 'UPDATE' && payload.new) {
              setFilms(prevFilms => {
                const updatedFilms = prevFilms.map(film => 
                  film.id === payload.new?.id ? payload.new : film
                );
                console.log('Updated films state:', updatedFilms.map(f => ({ id: f.id, title: f.title, status: f.status })));
                return updatedFilms;
              });
            }

            // Also fetch fresh data to ensure consistency
            try {
              await fetchFilms();
            } catch (error) {
              console.error('Error handling real-time update:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates');
          } else if (status === 'CLOSED') {
            console.log('Real-time subscription closed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error in real-time subscription');
          }
        });

      // Set up a periodic refresh every 5 seconds to ensure data consistency
      const refreshInterval = setInterval(fetchFilms, 5000);

      // Cleanup subscription and interval
      return () => {
        console.log('Cleaning up real-time subscription and interval');
        subscription.unsubscribe();
        clearInterval(refreshInterval);
      };
    }
  }, [user?.email]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckIcon className="h-3 w-3 mr-1" />
            {t('filmmakerDashboard.filmStatus.approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            {t('filmmakerDashboard.filmStatus.rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            {t('filmmakerDashboard.filmStatus.pending')}
          </span>
        );
    }
  };

  const FilmTable = ({ films, title }: { films: Film[], title: string }) => (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {films.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            {t('filmmakerDashboard.table.noFilms', { status: title.toLowerCase() })}
          </p>
        </div>
      ) : (
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('filmmakerDashboard.table.title')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('filmmakerDashboard.table.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('filmmakerDashboard.table.views')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('filmmakerDashboard.table.revenue')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('filmmakerDashboard.table.uploadDate')}
                </th>
                {title === t('filmmakerDashboard.filmStatus.approved') && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('filmmakerDashboard.table.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {films.map((film) => (
                <tr key={film.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{film.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(film.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {film.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${film.revenue?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(film.upload_date).toLocaleDateString()}
                  </td>
                  {title === t('filmmakerDashboard.filmStatus.approved') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/watch/${film.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t('filmmakerDashboard.table.watchFilm')}
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('filmmakerDashboard.title')}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/filmmaker/upload"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('filmmakerDashboard.uploadNewFilm')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('filmmakerDashboard.loading')}</div>
      ) : films.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('filmmakerDashboard.noFilms.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('filmmakerDashboard.noFilms.description')}
          </p>
          <div className="mt-6">
            <Link
              to="/filmmaker/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t('filmmakerDashboard.uploadNewFilm')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <FilmTable films={approvedFilms} title={t('filmmakerDashboard.filmStatus.approved')} />
          <FilmTable films={pendingFilms} title={t('filmmakerDashboard.filmStatus.pending')} />
          <FilmTable films={rejectedFilms} title={t('filmmakerDashboard.filmStatus.rejected')} />
        </>
      )}
    </div>
  );
};

export default FilmmakerDashboard; 