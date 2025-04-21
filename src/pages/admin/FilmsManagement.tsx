import React, { useState } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Film {
  id: string;
  title: string;
  filmmaker: string;
  views: number;
  revenue: number;
  price: number;
  status: 'approved' | 'pending' | 'rejected';
}

const FilmsManagement: React.FC = () => {
  const [films, setFilms] = useState<Film[]>([
    {
      id: '1',
      title: 'The Last Sunset',
      filmmaker: 'John Doe',
      views: 1250,
      revenue: 1250,
      price: 1,
      status: 'approved',
    },
    {
      id: '2',
      title: 'Morning Light',
      filmmaker: 'Jane Smith',
      views: 850,
      revenue: 850,
      price: 1,
      status: 'pending',
    },
  ]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Film>>({});
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Film Management</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Add New Film
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filmmaker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {films.map((film) => (
                <tr key={film.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{film.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{film.filmmaker}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{film.views}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${film.revenue}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${film.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      film.status === 'approved' ? 'bg-green-100 text-green-800' :
                      film.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {film.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(film)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(film.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleWatch(film)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                <label className="block text-sm font-medium text-gray-700">Views</label>
                <input
                  type="number"
                  name="views"
                  value={editFormData.views || ''}
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={editFormData.status || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
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
                {/* Replace this with your actual video player component */}
                <div className="bg-gray-200 rounded-lg flex items-center justify-center h-96">
                  <p className="text-gray-500">Video Player Placeholder</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">Filmmaker: {selectedFilm.filmmaker}</p>
                <p className="text-sm text-gray-500">Views: {selectedFilm.views}</p>
                <p className="text-sm text-gray-500">Price: ${selectedFilm.price}</p>
                <p className="text-sm text-gray-500">Status: {selectedFilm.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilmsManagement; 