import React, { useState, useMemo, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, XMarkIcon, CheckIcon, XCircleIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Film {
  id: string;
  title: string;
  filmmaker: string;
  views: number;
  revenue: number;
  price: number;
  status: 'approved' | 'pending' | 'rejected';
  rejectionNote?: string;
  uploadDate: string;
  videoUrl: string;
  lastAction?: {
    type: 'approve' | 'reject';
    admin: string;
    date: string;
  };
}

type SortField = 'title' | 'filmmaker' | 'uploadDate' | 'status' | 'lastAction';
type SortDirection = 'asc' | 'desc';

interface FilterPreferences {
  searchQuery: string;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  dateRange: {
    start: string;
    end: string;
  };
  sortField: SortField;
  sortDirection: SortDirection;
}

const FilmsManagement: React.FC = () => {
  // Load saved preferences from localStorage
  const loadPreferences = (): FilterPreferences => {
    const saved = localStorage.getItem('filmManagementPreferences');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      searchQuery: '',
      statusFilter: 'all',
      dateRange: {
        start: '',
        end: '',
      },
      sortField: 'uploadDate',
      sortDirection: 'desc',
    };
  };

  // Save preferences to localStorage
  const savePreferences = (prefs: FilterPreferences) => {
    localStorage.setItem('filmManagementPreferences', JSON.stringify(prefs));
  };

  const [preferences, setPreferences] = useState<FilterPreferences>(loadPreferences());
  const [films, setFilms] = useState<Film[]>([
    {
      id: '1',
      title: 'The Last Sunset',
      filmmaker: 'John Doe',
      views: 1250,
      revenue: 1250,
      price: 1,
      status: 'pending',
      uploadDate: '2024-03-15',
      videoUrl: 'https://example.com/video1.mp4',
    },
    {
      id: '2',
      title: 'Morning Light',
      filmmaker: 'Jane Smith',
      views: 850,
      revenue: 850,
      price: 1,
      status: 'pending',
      uploadDate: '2024-03-16',
      videoUrl: 'https://example.com/video2.mp4',
    },
  ]);

  // Update preferences and save to localStorage
  const updatePreferences = (updates: Partial<FilterPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Film>>({});
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [selectedFilms, setSelectedFilms] = useState<Set<string>>(new Set());

  // Filter and sort films
  const filteredAndSortedFilms = useMemo(() => {
    let result = [...films];

    // Apply search filter
    if (preferences.searchQuery) {
      const query = preferences.searchQuery.toLowerCase();
      result = result.filter(film => 
        film.title.toLowerCase().includes(query) || 
        film.filmmaker.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (preferences.statusFilter !== 'all') {
      result = result.filter(film => film.status === preferences.statusFilter);
    }

    // Apply date range filter
    if (preferences.dateRange.start) {
      const startDate = new Date(preferences.dateRange.start);
      result = result.filter(film => new Date(film.uploadDate) >= startDate);
    }
    if (preferences.dateRange.end) {
      const endDate = new Date(preferences.dateRange.end);
      result = result.filter(film => new Date(film.uploadDate) <= endDate);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (preferences.sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'filmmaker':
          comparison = a.filmmaker.localeCompare(b.filmmaker);
          break;
        case 'uploadDate':
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'lastAction':
          const dateA = a.lastAction?.date ? new Date(a.lastAction.date).getTime() : 0;
          const dateB = b.lastAction?.date ? new Date(b.lastAction.date).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      return preferences.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [films, preferences]);

  const handleSort = (field: SortField) => {
    if (preferences.sortField === field) {
      setPreferences(prev => ({ ...prev, sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc' }));
    } else {
      setPreferences(prev => ({ ...prev, sortField: field, sortDirection: 'asc' }));
    }
  };

  const getSortIcon = (field: SortField) => {
    if (preferences.sortField !== field) return null;
    return preferences.sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  const handleSelectFilm = (filmId: string) => {
    const newSelected = new Set(selectedFilms);
    if (newSelected.has(filmId)) {
      newSelected.delete(filmId);
    } else {
      newSelected.add(filmId);
    }
    setSelectedFilms(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFilms.size === filteredAndSortedFilms.length) {
      setSelectedFilms(new Set());
    } else {
      setSelectedFilms(new Set(filteredAndSortedFilms.map(f => f.id)));
    }
  };

  const handleBulkApprove = () => {
    setConfirmAction('approve');
    setIsConfirmModalOpen(true);
  };

  const handleBulkReject = () => {
    setConfirmAction('reject');
    setIsConfirmModalOpen(true);
  };

  const confirmBulkAction = () => {
    if (confirmAction === 'approve') {
      const now = new Date().toISOString();
      const updatedFilms: Film[] = films.map(f => 
        selectedFilms.has(f.id) 
          ? { 
              ...f, 
              status: 'approved' as const, 
              rejectionNote: undefined,
              lastAction: {
                type: 'approve' as const,
                admin: currentAdmin,
                date: now
              }
            } 
          : f
      );
      setFilms(updatedFilms);
    } else if (confirmAction === 'reject') {
      setSelectedFilm(films.find(f => f.id === Array.from(selectedFilms)[0]) || null);
      setIsRejectModalOpen(true);
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleDelete = (id: string) => {
    setFilms(films.filter(film => film.id !== id));
  };

  const handleEdit = (film: Film) => {
    setEditingFilm(film);
    setEditFormData({ ...film });
    setIsEditModalOpen(true);
  };

  const handleWatch = (film: Film) => {
    setSelectedFilm(film);
    setIsWatchModalOpen(true);
  };

  const handleApprove = (film: Film) => {
    const now = new Date().toISOString();
    setFilms(films.map(f => 
      f.id === film.id 
        ? { 
            ...f, 
            status: 'approved' as const, 
            rejectionNote: undefined,
            lastAction: {
              type: 'approve' as const,
              admin: currentAdmin,
              date: now
            }
          } 
        : f
    ));
  };

  const handleReject = (film: Film) => {
    setSelectedFilm(film);
    setIsRejectModalOpen(true);
  };

  const handleSaveRejection = () => {
    if (selectedFilm) {
      const now = new Date().toISOString();
      const updatedFilms: Film[] = films.map(f => {
        if (selectedFilms.has(f.id) || f.id === selectedFilm.id) {
          return {
            ...f,
            status: 'rejected' as const,
            rejectionNote,
            lastAction: {
              type: 'reject' as const,
              admin: currentAdmin,
              date: now
            }
          };
        }
        return f;
      });
      setFilms(updatedFilms);
      setIsRejectModalOpen(false);
      setRejectionNote('');
      setSelectedFilms(new Set());
    }
  };

  const handleSaveEdit = () => {
    if (editingFilm) {
      setFilms(films.map(film => 
        film.id === editingFilm.id ? { ...film, ...editFormData } : film
      ));
      setIsEditModalOpen(false);
      setEditingFilm(null);
      setEditFormData({});
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ 
      ...prev, 
      [name]: name === 'views' || name === 'revenue' || name === 'price' 
        ? Number(value) 
        : value 
    }));
  };

  const getStatusBadge = (status: string, rejectionNote?: string) => {
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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Title', 'Filmmaker', 'Upload Date', 'Status', 'Rejection Note', 'Last Action', 'Admin'];
    const rows = filteredAndSortedFilms.map(film => [
      film.title,
      film.filmmaker,
      film.uploadDate,
      film.status,
      film.rejectionNote || '',
      film.lastAction ? `${film.lastAction.type} on ${new Date(film.lastAction.date).toLocaleString()}` : '',
      film.lastAction?.admin || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `films_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentAdmin = 'Admin User'; // This would come from your auth system

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Film Management</h1>
        <div className="space-x-2">
          {selectedFilms.size > 0 && (
            <>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Bulk Approve ({selectedFilms.size})
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Bulk Reject ({selectedFilms.size})
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
              value={preferences.searchQuery}
              onChange={(e) => updatePreferences({ searchQuery: e.target.value })}
              placeholder="Search by title or filmmaker..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={preferences.statusFilter}
              onChange={(e) => updatePreferences({ statusFilter: e.target.value as any })}
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
              value={preferences.dateRange.start}
              onChange={(e) => updatePreferences({
                dateRange: { ...preferences.dateRange, start: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={preferences.dateRange.end}
              onChange={(e) => updatePreferences({
                dateRange: { ...preferences.dateRange, end: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => updatePreferences({
                dateRange: { start: '', end: '' }
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
                    checked={selectedFilms.size === filteredAndSortedFilms.length}
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
                  onClick={() => handleSort('uploadDate')}
                >
                  <div className="flex items-center">
                    Upload Date
                    {getSortIcon('uploadDate')}
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
                  onClick={() => handleSort('lastAction')}
                >
                  <div className="flex items-center">
                    Last Action
                    {getSortIcon('lastAction')}
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
                      checked={selectedFilms.has(film.id)}
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
                    <div className="text-sm text-gray-500">{film.uploadDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(film.status, film.rejectionNote)}
                    {film.rejectionNote && (
                      <div className="mt-1 text-xs text-red-600">
                        {film.rejectionNote}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {film.lastAction && (
                      <div className="text-xs text-gray-500">
                        <div>{film.lastAction.type === 'approve' ? 'Approved' : 'Rejected'} by {film.lastAction.admin}</div>
                        <div>{new Date(film.lastAction.date).toLocaleString()}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleWatch(film)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {film.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(film)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleReject(film)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(film.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && confirmAction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
              </h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to {confirmAction} {selectedFilms.size} film{selectedFilms.size !== 1 ? 's' : ''}?
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
                  confirmAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                Confirm {confirmAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingFilm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Edit Film</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Filmmaker</label>
                <input
                  type="text"
                  name="filmmaker"
                  value={editFormData.filmmaker || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watch Modal */}
      {isWatchModalOpen && selectedFilm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Watch Film: {selectedFilm.title}</h3>
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
                  src={selectedFilm.videoUrl}
                  controls
                  className="w-full h-full rounded-lg"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">Filmmaker: {selectedFilm.filmmaker}</p>
                <p className="text-sm text-gray-500">Upload Date: {selectedFilm.uploadDate}</p>
                <p className="text-sm text-gray-500">Status: {selectedFilm.status}</p>
                {selectedFilm.rejectionNote && (
                  <p className="text-sm text-red-600">Rejection Note: {selectedFilm.rejectionNote}</p>
                )}
                {selectedFilm.lastAction && (
                  <p className="text-sm text-gray-500">
                    Last Action: {selectedFilm.lastAction.type === 'approve' ? 'Approved' : 'Rejected'} by {selectedFilm.lastAction.admin} on {new Date(selectedFilm.lastAction.date).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedFilm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Reject Film: {selectedFilm.title}</h3>
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
                    src={selectedFilm.videoUrl}
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
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={4}
                      placeholder="Enter the reason for rejecting this film..."
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Filmmaker: {selectedFilm.filmmaker}</p>
                    <p>Upload Date: {selectedFilm.uploadDate}</p>
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
                onClick={handleSaveRejection}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reject Film{selectedFilms.size > 0 ? `s (${selectedFilms.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmsManagement; 