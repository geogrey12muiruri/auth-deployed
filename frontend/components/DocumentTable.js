import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import DocumentForm from './DocumentForm'; // Adjust path as needed

const DocumentTable = () => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5002/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [token]);

  const handleView = (fileUrl) => {
    // Construct full URL and open in a new tab
    const fullUrl = `http://localhost:5002${fileUrl}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Document
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-600">No documents found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Version</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Revision</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{doc.title}</td>
                  <td className="px-4 py-2 text-gray-800">{doc.category}</td>
                  <td className="px-4 py-2 text-gray-800">{doc.version}</td>
                  <td className="px-4 py-2 text-gray-800">{doc.revision}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleView(doc.fileUrl)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <DocumentForm setDocuments={setDocuments} closeModal={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default DocumentTable;