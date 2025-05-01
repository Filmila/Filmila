import React, { useState, useMemo, useEffect } from 'react';
import { TrashIcon, EyeIcon, XMarkIcon, CheckIcon, XCircleIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Film } from '../../types';
import { filmService } from '../../services/filmService';
import { supabase } from '../../config/supabase';
import { toast } from 'react-hot-toast';

type SortField = 'title' | 'filmmaker' | 'upload_date' | 'status' | 'last_action';
type SortOrder = 'asc' | 'desc';

interface FilterPreferences {
  search_term: string;
  status_filter: string;
  sort_field: SortField;
  sort_order: SortOrder;
  start_date: string;
  end_date: string;
}

interface FilmWithActions extends Film {
  last_action?: {
    type: 'approve' | 'reject';
    admin: string;
    date: string;
    note?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
}

const FilmsManagement: React.FC = () => {
  const [films, setFilms] = useState<FilmWithActions[]>([]);
  const [selected_films, setSelectedFilms] = useState<Set<string>>(new Set());
  const [confirm_action, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [is_reject_modal_open, setIsRejectModalOpen] = useState(false);
  const [selected_film, setSelectedFilm] = useState<Film | null>(null);
  const [rejection_note, setRejectionNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortField, setSortField] = useState<string>('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('filmsFilters');
    if (savedFilters) {
      const { status, start, end, sort, order } = JSON.parse(savedFilters);
      setSelectedStatus(status || 'all');
      setStartDate(start || '');
      setEndDate(end || '');
      setSortField(sort || 'upload_date');
      setSortOrder(order || 'desc');
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('filmsFilters', JSON.stringify({
      status: selectedStatus,
      start: startDate,
      end: endDate,
      sort: sortField,
      order: sortOrder
    }));
  }, [selectedStatus, startDate, endDate, sortField, sortOrder]);

  // Add real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchFilms();

    // Set up real-time subscription
    console.log('Setting up real-time subscription for films');
    const subscription = supabase
      .channel('films-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'films'
        },
        (payload) => {
          console.log('Real-time update received:', {
            eventType: payload.eventType,
            old: payload.old,
            new: payload.new
          });
          
          // Immediately update the films state with the new data
          if (payload.eventType === 'UPDATE' && payload.new) {
            setFilms(prevFilms => {
              const updatedFilms = prevFilms.map(film => 
                film.id === payload.new?.id ? { ...film, ...payload.new } as FilmWithActions : film
              );
              console.log('Updated films state:', updatedFilms.map(f => ({ id: f.id, title: f.title, status: f.status })));
              return updatedFilms;
            });
          }
          
          // Also fetch fresh data to ensure consistency
          fetchFilms();
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
  }, []);

  const fetchFilms = async () => {
    try {
      console.log('Fetching films...');
      let query = supabase
        .from('films')
        .select('*');

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      if (startDate) {
        query = query.gte('upload_date', startDate);
      }

      if (endDate) {
        query = query.lte('upload_date', endDate);
      }

      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching films:', fetchError);
        throw fetchError;
      }

      console.log('Films fetched successfully:', data?.length || 0, 'films');
      setFilms(data || []);
    } catch (error) {
      console.error('Error in fetchFilms:', error);
      toast.error('Failed to fetch films');
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Filmmaker', 'Status', 'Upload Date', 'Views', 'Revenue'];
    const csvData = films.map(film => [
      film.title,
      film.filmmaker,
      film.status,
      new Date(film.upload_date).toLocaleDateString(),
      film.views,
      film.revenue
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `films_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load saved preferences from localStorage
  const loadPreferences = (): FilterPreferences => {
    const saved = localStorage.getItem('filmManagementPreferences');
    return saved ? JSON.parse(saved) : {
      search_term: '',
      status_filter: 'all',
      sort_field: 'upload_date',
      sort_order: 'desc',
      start_date: '',
      end_date: ''
    };
  };

  const [preferences, setPreferences] = useState<FilterPreferences>(loadPreferences());

  // Save preferences to localStorage
  const savePreferences = (prefs: FilterPreferences) => {
    localStorage.setItem('filmManagementPreferences', JSON.stringify(prefs));
  };

  // Update preferences and save to localStorage
  const updatePreferences = (updates: Partial<FilterPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const [is_watch_modal_open, setIsWatchModalOpen] = useState(false);

  // Filter and sort films
  const filteredAndSortedFilms = useMemo(() => {
    let result = [...films];

    // Apply search filter
    if (preferences.search_term) {
      const query = preferences.search_term.toLowerCase();
      result = result.filter(film => 
        film.title.toLowerCase().includes(query) || 
        film.filmmaker.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (preferences.status_filter !== 'all') {
      result = result.filter(film => film.status === preferences.status_filter);
    }

    // Apply date range filter
    if (preferences.start_date) {
      const startDate = new Date(preferences.start_date);
      result = result.filter(film => new Date(film.upload_date) >= startDate);
    }
    if (preferences.end_date) {
      const endDate = new Date(preferences.end_date);
      result = result.filter(film => new Date(film.upload_date) <= endDate);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (preferences.sort_field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'filmmaker':
          comparison = a.filmmaker.localeCompare(b.filmmaker);
          break;
        case 'upload_date':
          comparison = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'last_action':
          const dateA = a.last_action?.date ? new Date(a.last_action.date).getTime() : 0;
          const dateB = b.last_action?.date ? new Date(b.last_action.date).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      return preferences.sort_order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [films, preferences]);

  const getSortIcon = (field: SortField) => {
    if (preferences.sort_field !== field) return null;
    return preferences.sort_order === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  const handleSelectFilm = (filmId: string) => {
    const newSelected = new Set(selected_films);
    if (newSelected.has(filmId)) {
      newSelected.delete(filmId);
    } else {
      newSelected.add(filmId);
    }
    setSelectedFilms(newSelected);
  };

  const handleSelectAll = () => {
    if (selected_films.size === filteredAndSortedFilms.length) {
      setSelectedFilms(new Set());
    } else {
      setSelectedFilms(new Set(filteredAndSortedFilms.map(f => f.id)));
    }
  };

  const handleBulkApprove = async () => {
    try {
      await Promise.all(
        Array.from(selected_films).map(id => 
          filmService.updateFilmStatus(id, 'approved', undefined)
        )
      );
      
      // Refresh the films list to ensure we have the latest data
      await fetchFilms();
      
      setSelectedFilms(new Set());
      toast.success('Selected films approved successfully');
    } catch (error) {
      console.error('Error approving films:', error);
      if (error instanceof Error && error.message.includes('Version conflict')) {
        await fetchFilms(); // Refresh the films list on version conflict
        toast.error('Some films were updated by another user. Please try again.');
      } else {
        toast.error('Failed to approve films');
      }
    }
  };

  const handleBulkReject = async () => {
    try {
      const results = await Promise.all(
        Array.from(selected_films).map(id => 
          filmService.updateFilmStatus(id, 'rejected', 'Rejected by admin')
        )
      );
      
      // Update the films list with all updated films
      setFilms(prevFilms => 
        prevFilms.map(film => {
          const updatedFilm = results.find(r => r.id === film.id);
          return updatedFilm ? { ...film, ...updatedFilm } : film;
        })
      );
      
      setSelectedFilms(new Set());
      toast.success('Selected films rejected successfully');
    } catch (error) {
      console.error('Error rejecting films:', error);
      if (error instanceof Error && error.message.includes('Version conflict')) {
        await fetchFilms(); // Refresh the films list on version conflict
        toast.error('Some films were updated by another user. Please try again.');
      } else {
        toast.error('Failed to reject films');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await filmService.deleteFilm(id);
      setFilms(films.filter(film => film.id !== id));
    } catch (err) {
      console.error('Failed to delete film:', err);
    }
  };

  const handleWatch = (film: Film) => {
    setSelectedFilm(film);
    setIsWatchModalOpen(true);
  };

  const handleApprove = async (film: FilmWithActions) => {
    try {
      console.log('Starting film approval process for film:', { id: film.id, title: film.title });
      const updatedFilm = await filmService.updateFilmStatus(film.id, 'approved');
      console.log('Film approval response:', updatedFilm);

      // Refresh the films list to ensure we have the latest data
      await fetchFilms();

      toast.success('Film approved successfully');
    } catch (error) {
      console.error('Error approving film:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve film');
    }
  };

  const handleReject = async (id: string) => {
    try {
      console.log('Attempting to reject film:', id);
      const updatedFilm = await filmService.updateFilmStatus(id, 'rejected', 'Rejected by admin');
      
      // Update the films list with the updated film
      setFilms(prevFilms => 
        prevFilms.map(film => 
          film.id === id ? { ...film, ...updatedFilm } : film
        )
      );
      
      toast.success('Film rejected successfully');
    } catch (error) {
      console.error('Error rejecting film:', error);
      if (error instanceof Error) {
        toast.error(`Failed to reject film: ${error.message}`);
      } else {
        toast.error('Failed to reject film. Please try again.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  const [is_confirm_modal_open, setIsConfirmModalOpen] = useState(false);

  const renderActionButtons = (film: Film) => {
    return (
      <div className="flex space-x-2">
        {film.status === 'pending' && (
          <>
            <button
              onClick={() => handleApprove(film as FilmWithActions)}
              className="text-green-600 hover:text-green-900"
              title="Approve Film"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setSelectedFilm(film);
                setIsRejectModalOpen(true);
              }}
              className="text-red-600 hover:text-red-900"
              title="Reject Film"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </>
        )}
        <button
          onClick={() => handleWatch(film)}
          className="text-blue-600 hover:text-blue-900"
          title="Watch Film"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleDelete(film.id)}
          className="text-gray-600 hover:text-gray-900"
          title="Delete Film"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    );
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    if (action === 'approve') {
      handleBulkApprove();
    } else {
      handleBulkReject();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Film Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => handleBulkAction('approve')}
            disabled={selected_films.size === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            Approve Selected ({selected_films.size})
          </button>
          <button
            onClick={() => handleBulkAction('reject')}
            disabled={selected_films.size === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            Reject Selected ({selected_films.size})
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add New Film
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={preferences.search_term}
              onChange={(e) => updatePreferences({ search_term: e.target.value })}
              placeholder="Search by title or filmmaker..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, endDate)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange(startDate, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => updatePreferences({
                start_date: '',
                end_date: ''
              })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selected_films.size === filteredAndSortedFilms.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    {getSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('filmmaker')}
                >
                  <div className="flex items-center">
                    Filmmaker
                    {getSortIcon('filmmaker')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('upload_date')}
                >
                  <div className="flex items-center">
                    Upload Date
                    {getSortIcon('upload_date')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_action')}
                >
                  <div className="flex items-center">
                    Last Action
                    {getSortIcon('last_action')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedFilms.map((film) => (
                <tr key={film.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selected_films.has(film.id)}
                      onChange={() => handleSelectFilm(film.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{film.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{film.filmmaker}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{film.upload_date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(film.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {film.last_action && (
                      <div className="text-xs text-gray-500">
                        <div>{film.last_action.type === 'approve' ? 'Approved' : 'Rejected'} by {film.last_action.admin}</div>
                        <div>{new Date(film.last_action.date).toLocaleString()}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {renderActionButtons(film)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {is_confirm_modal_open && confirm_action && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm {confirm_action === 'approve' ? 'Approval' : 'Rejection'}
              </h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to {confirm_action} {selected_films.size} film{selected_films.size !== 1 ? 's' : ''}?
              </p>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmAction(null);
                }}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleBulkAction(confirm_action);
                  setIsConfirmModalOpen(false);
                  setConfirmAction(null);
                }}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  confirm_action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                Confirm {confirm_action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watch Modal */}
      {is_watch_modal_open && selected_film && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Watch Film: {selected_film.title}</h3>
              <button
                onClick={() => setIsWatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-w-16 aspect-h-9">
                <video
                  src={selected_film.video_url}
                  controls
                  className="w-full h-full rounded-lg"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">Filmmaker: {selected_film.filmmaker}</p>
                <p className="text-sm text-gray-500">Upload Date: {selected_film.upload_date}</p>
                <p className="text-sm text-gray-500">Status: {selected_film.status}</p>
                {selected_film.rejection_note && (
                  <p className="text-sm text-red-600">Rejection Note: {selected_film.rejection_note}</p>
                )}
                {selected_film.last_action && (
                  <p className="text-sm text-gray-500">
                    Last Action: {selected_film.last_action.type === 'approve' ? 'Approved' : 'Rejected'} by {selected_film.last_action.admin} on {new Date(selected_film.last_action.date).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {is_reject_modal_open && selected_film && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Reject Film: {selected_film.title}</h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-w-16 aspect-h-9">
                  <video
                    src={selected_film.video_url}
                    controls
                    className="w-full h-full rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={rejection_note}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={4}
                      placeholder="Enter the reason for rejecting this film..."
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Filmmaker: {selected_film.filmmaker}</p>
                    <p>Upload Date: {selected_film.upload_date}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selected_film) {
                    handleReject(selected_film.id);
                  } else if (selected_films.size > 0) {
                    // Handle bulk rejection
                    films
                      .filter(film => selected_films.has(film.id))
                      .forEach(film => handleReject(film.id));
                  }
                }}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={!rejection_note.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmsManagement; 