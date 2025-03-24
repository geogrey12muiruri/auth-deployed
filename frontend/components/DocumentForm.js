import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';

const DocumentForm = ({ setDocuments, closeModal }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!title || !version || !file) {
      setError('Title, version, and file are required');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category || 'Uncategorized'); // Default if empty
    formData.append('version', version.padStart(2, '0')); // Ensure two-digit version (e.g., "01")
    formData.append('description', description || '');
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5002/api/documents', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });
      setDocuments((prev) => [...prev, res.data]);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create document');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative transform transition-all duration-300 scale-100">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add New Document</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter document title"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Academics"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              id="version"
              type="text" // Changed to text to handle padding
              value={version}
              onChange={(e) => setVersion(e.target.value.replace(/[^0-9]/g, ''))} // Only allow numbers
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., 01"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe the document"
              rows="3"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Upload File <span className="text-red-500">*</span>
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf" // Restrict to PDFs
              className="w-full p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
        {loading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-600 mt-2">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentForm;