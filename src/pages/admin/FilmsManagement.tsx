import React, { useState, useMemo, useEffect } from 'react';
import { TrashIcon, EyeIcon, XMarkIcon, CheckIcon, XCircleIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Film } from '../../types';
import { filmService } from '../../services/filmService';
import { supabase } from '../../config/supabase';
import { notificationService } from '../../services/notificationService';
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
}

const FilmsManagement: React.FC = () => {
  const [films, setFilms] = useState<FilmWithActions[]>([]);
  const [selected_films, setSelectedFilms] = useState<Set<string>>(new Set());
  const [confirm_action, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [is_reject_modal_open, setIsRejectModalOpen] = useState(false);
  const [selected_film, setSelectedFilm] = useState<Film | null>(null);
  const [rejection_note, setRejectionNote] = useState('');
  const currentAdmin = 'Admin User'; // This should come from your auth context
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
          console.log('Real-time update received:', payload);
          fetchFilms(); // Refresh the entire list when any change occurs
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
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
      const filmsToApprove = films.filter(film => selected_films.has(film.id));
      
      for (const film of filmsToApprove) {
        await handleApprove(film);
      }

      setSelectedFilms(new Set());
    } catch (error) {
      console.error('Error in bulk approve:', error);
    }
  };

  const handleBulkReject = () => {
    setConfirmAction('reject');
    setIsRejectModalOpen(true);
  };

  const confirmBulkAction = async () => {
    if (confirm_action === 'approve') {
      try {
        const updatedFilms: Film[] = await Promise.all(Array.from(selected_films).map(async id => {
          const updatedFilm = await filmService.updateFilmStatus(id, 'approved', undefined);
          return updatedFilm;
        }));
        setFilms(updatedFilms);
      } catch (err) {
        console.error('Failed to bulk approve films:', err);
      }
    } else if (confirm_action === 'reject') {
      setSelectedFilm(films.find(f => f.id === Array.from(selected_films)[0]) || null);
      setIsRejectModalOpen(true);
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
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

  const getLatestFilmVersion = async (filmId: string): Promise<{ version: number, status: string } | null> => {
    try {
      const { data, error } = await supabase
        .from('films')
        .select('version, status')
        .eq('id', filmId)
        .single();

      if (error) {
        console.error('Error fetching latest film version:', error);
        return null;
      }

      console.log('Latest film version fetched:', {
        filmId,
        version: data.version,
        status: data.status
      });

      return data;
    } catch (error) {
      console.error('Error in getLatestFilmVersion:', error);
      return null;
    }
  };

  const handleApprove = async (film: Film) => {
    try {
      console.log('Starting approval process for film:', film.id);

      // Get the latest version right before approval
      const latestVersion = await getLatestFilmVersion(film.id);
      
      if (!latestVersion) {
        toast.error('Failed to fetch current film version');
        return;
      }

      console.log('Version comparison:', {
        filmId: film.id,
        localVersion: film.version,
        databaseVersion: latestVersion.version,
        currentStatus: latestVersion.status
      });

      // Check if status is already approved
      if (latestVersion.status === 'approved') {
        toast('This film is already approved', {
          icon: 'ℹ️',
          duration: 4000
        });
        await fetchFilms(); // Refresh list to show current state
        return;
      }

      // Check for version mismatch
      if (film.version !== latestVersion.version) {
        console.warn('Version mismatch detected:', {
          filmId: film.id,
          localVersion: film.version,
          databaseVersion: latestVersion.version
        });
        toast.error('Film version mismatch. Please refresh the page and try again.');
        await fetchFilms(); // Refresh list to show current state
        return;
      }

      const newVersion = latestVersion.version + 1;
      console.log('Attempting update with:', {
        filmId: film.id,
        currentVersion: latestVersion.version,
        newVersion: newVersion,
        status: 'approved'
      });

      // Update film status in database with latest version
      const { data, error: updateError } = await supabase
        .from('films')
        .update({ 
          status: 'approved',
          version: newVersion,
          last_action: {
            type: 'approve',
            admin: currentAdmin,
            date: new Date().toISOString()
          }
        })
        .eq('id', film.id)
        .eq('version', latestVersion.version)
        .select();

      if (updateError) {
        console.error('Error updating film:', {
          error: updateError,
          filmId: film.id,
          currentVersion: latestVersion.version,
          newVersion: newVersion
        });
        if (updateError.code === '23514') {
          toast.error('Invalid status transition');
        } else {
          toast.error('Failed to approve film. Please try again.');
        }
        return;
      }

      if (!data || data.length === 0) {
        console.error('Update failed - no rows affected:', {
          filmId: film.id,
          currentVersion: latestVersion.version,
          newVersion: newVersion,
          query: {
            id: film.id,
            version: latestVersion.version
          }
        });
        
        // Fetch the current state to see what changed
        const { data: currentState } = await supabase
          .from('films')
          .select('version, status')
          .eq('id', film.id)
          .single();
          
        console.log('Current film state:', currentState);
        
        toast.error('Film approval failed. Please refresh and try again.');
        await fetchFilms(); // Refresh list to show current state
        return;
      }

      const updatedFilm = data[0];

      console.log('Film approved successfully:', {
        filmId: film.id,
        oldVersion: latestVersion.version,
        newVersion: updatedFilm.version,
        data: data
      });

      // Update local state
      setFilms(films.map(f => 
        f.id === film.id ? updatedFilm : f
      ));

      // Show success message
      toast.success(`Film "${film.title}" has been approved`);

      // Try to send notification
      try {
        await notificationService.sendFilmApprovalNotification(
          film.title,
          film.filmmaker
        );
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        toast('Film approved, but notification could not be sent to filmmaker', {
          icon: '⚠️',
          duration: 4000
        });
      }

      // Refresh the films list to ensure consistency
      await fetchFilms();
    } catch (error) {
      console.error('Unexpected error during film approval:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleReject = async (film: Film, note: string) => {
    try {
      const { error } = await supabase
        .from('films')
        .update({
          status: 'rejected',
          last_action: {
            type: 'reject',
            admin: currentAdmin,
            date: new Date().toISOString(),
            note
          }
        })
        .eq('id', film.id);

      if (error) throw error;

      // Send notification to filmmaker
      await notificationService.sendFilmRejectionNotification(
        film.title,
        film.filmmaker,
        note
      );

      // Update local state
      setFilms(prev =>
        prev.map(f =>
          f.id === film.id
            ? {
                ...f,
                status: 'rejected',
                last_action: {
                  type: 'reject',
                  admin: currentAdmin,
                  date: new Date().toISOString(),
                  note
                }
              }
            : f
        )
      );

      setIsRejectModalOpen(false);
      setRejectionNote('');
      setSelectedFilm(null);
    } catch (error) {
      console.error('Error rejecting film:', error);
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
              onClick={() => handleApprove(film)}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Film Management</h1>
        <div className="space-x-2">
          {selected_films.size > 0 && (
            <>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Bulk Approve ({selected_films.size})
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Bulk Reject ({selected_films.size})
              </button>
            </>
          )}
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
                onClick={confirmBulkAction}
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
                    handleReject(selected_film, rejection_note);
                  } else if (selected_films.size > 0) {
                    // Handle bulk rejection
                    films
                      .filter(film => selected_films.has(film.id))
                      .forEach(film => handleReject(film, rejection_note));
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