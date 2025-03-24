"use client";

import React from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const AuditorDashboard = () => {
  return (
    <RoleProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div>
          <h1>Auditor Dashboard</h1>
        
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default AuditorDashboard;