import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { uploadFileToS3 } from '../../services/s3Service';

const UploadFilm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Film>>({
    title: '',
    description: '',
    price: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        setError('Please upload a valid video file');
        return;
      }
      // Validate file size (e.g., 500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        setError('File size should be less than 500MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate a unique key for the file
      const fileKey = `films/${user?.email}/${Date.now()}-${selectedFile.name}`;
      
      console.log('Starting upload to S3...');
      console.log('File details:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        key: fileKey
      });

      // Upload file to S3
      const videoUrl = await uploadFileToS3(selectedFile, fileKey);
      console.log('Upload successful. Video URL:', videoUrl);
      
      // Create a new film object with all required fields
      const newFilm: Film = {
        id: Date.now().toString(),
        title: formData.title || '',
        filmmaker: user?.email || 'Unknown Filmmaker',
        description: formData.description || '',
        price: formData.price || 0,
        views: 0,
        revenue: 0,
        status: 'pending',
        uploadDate: new Date().toISOString(),
        videoUrl,
      };

      // Store film data in localStorage
      const existingFilms = JSON.parse(localStorage.getItem('films') || '[]');
      localStorage.setItem('films', JSON.stringify([...existingFilms, newFilm]));
      
      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Upload error details:', err);
      if (err instanceof Error) {
        setError(`Upload failed: ${err.message}`);
      } else {
        setError('Failed to upload film. Please check your network connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload New Film</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
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
            Description
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
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (USD)
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
            Video File
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
              Selected file: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Upload Film'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadFilm; 