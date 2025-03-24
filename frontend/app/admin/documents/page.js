"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/auth-context';
import DocumentsTable from '@/components/DocumentTable';
import DocumentForm from '@/components/DocumentForm';

const DocumentsPage = () => {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      setError("Authentication required.");
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await fetch("http://localhost:5002/api/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch documents");
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, token]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">University Policy Documents</h1>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New Policy
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p>Loading documents...</p>
      ) : documents.length === 0 ? (
        <p>No documents available.</p>
      ) : (
        <DocumentsTable documents={documents} />
      )}

      {showModal && (
        <DocumentForm setDocuments={setDocuments} closeModal={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default DocumentsPage;