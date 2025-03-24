"use client";

import React from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const AdminDashboard = () => {
  return (
    <RoleProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div>
          <h1>Admin Dashboard</h1>
          {/* Admin dashboard content */}
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default AdminDashboard;