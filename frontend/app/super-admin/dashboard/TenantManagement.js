"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get('/api/tenants/superadmin/tenants');
        setTenants(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleDelete = async (tenantId) => {
    try {
      await axios.delete(`/api/tenants/superadmin/tenants/${tenantId}`);
      setTenants(tenants.filter(tenant => tenant.id !== tenantId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Tenant Management</h2>
      <ul>
        {tenants.map(tenant => (
          <li key={tenant.id}>
            {tenant.name} ({tenant.code})
            <button onClick={() => handleDelete(tenant.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TenantManagement;
