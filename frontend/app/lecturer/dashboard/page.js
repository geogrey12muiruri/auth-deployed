"use client";

import React from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const LecturerDashboard = () => {
  return (
    <RoleProtectedRoute requiredRole="LECTURER">
      <DashboardLayout>
        <div>
          <h1>Lecturer Dashboard</h1>
          <p>Welcome to the Lecturer dashboard</p>
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default LecturerDashboard;