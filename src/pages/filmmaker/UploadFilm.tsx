import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { uploadFileToS3 } from '../../services/s3Service';
import { filmService } from '../../services/filmService';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const UploadFilm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Film>>({
    title: '',
    description: '',
    price: 0,
    genre: 'Drama'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genres = [
    'Drama',
    'Comedy',
    'Action',
    'Romance',
    'Thriller',
    'Documentary',
    'Horror',
    'Sci-Fi',
    'Animation',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError(t('uploadFilm.errors.invalidVideo'));
        return;
      }
      // Validate file size (e.g., 500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        setError(t('uploadFilm.errors.videoSizeLimit'));
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('uploadFilm.errors.invalidThumbnail'));
        return;
      }
      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('uploadFilm.errors.thumbnailSizeLimit'));
        return;
      }
      setSelectedThumbnail(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError(t('uploadFilm.errors.videoRequired'));
      return;
    }
    if (!selectedThumbnail) {
      setError(t('uploadFilm.errors.thumbnailRequired'));
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      // Upload video
      const fileKey = `films/${user?.email}/${Date.now()}-${selectedFile.name}`;
      console.log('Starting video upload with key:', fileKey);
      const videoUrl = await uploadFileToS3(selectedFile, fileKey);
      console.log('Video upload completed. URL:', videoUrl);
      
      // Upload thumbnail
      const thumbKey = `films/${user?.email}/thumbnails/${Date.now()}-${selectedThumbnail.name}`;
      console.log('Starting thumbnail upload with key:', thumbKey);
      const thumbnailUrl = await uploadFileToS3(selectedThumbnail, thumbKey);
      console.log('Thumbnail upload completed. URL:', thumbnailUrl);

      // Create a new film object with thumbnail_url
      const newFilm: Omit<Film, 'id'> = {
        title: formData.title || '',
        filmmaker: user?.email || 'Unknown Filmmaker',
        description: formData.description || '',
        price: formData.price || 0,
        views: 0,
        revenue: 0,
        status: 'pending',
        upload_date: new Date().toISOString(),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        genre: formData.genre || 'Drama',
        version: 1
      };
      await filmService.createFilm(newFilm);
      toast.success(t('uploadFilm.success'));
      navigate('/dashboard');
    } catch (err) {
      console.error('Upload error details:', err);
      if (err instanceof Error) {
        setError(`Upload failed: ${err.message}`);
      } else {
        setError(t('uploadFilm.errors.uploadFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t('uploadFilm.title')}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            {t('uploadFilm.form.title')}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t('uploadFilm.form.description')}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
            {t('uploadFilm.form.genre')}
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>
                {t(genre.toLowerCase())}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            {t('uploadFilm.form.price')}
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="video" className="block text-sm font-medium text-gray-700">
            {t('uploadFilm.form.videoFile')}
          </label>
          <input
            type="file"
            id="video"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            required
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-500">
              {t('uploadFilm.selectedFile', {
                name: selectedFile.name,
                size: (selectedFile.size / (1024 * 1024)).toFixed(2)
              })}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
            {t('uploadFilm.form.thumbnailImage')}
          </label>
          <input
            type="file"
            id="thumbnail"
            onChange={handleThumbnailChange}
            accept="image/*"
            required
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          {selectedThumbnail && (
            <p className="mt-2 text-sm text-gray-500">
              {t('uploadFilm.selectedFile', {
                name: selectedThumbnail.name,
                size: (selectedThumbnail.size / (1024 * 1024)).toFixed(2)
              })}
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Uploading...' : t('uploadFilm.form.submit')}
        </button>
      </form>
    </div>
  );
};

export default UploadFilm; 