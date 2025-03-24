"use client";

import React from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const AuditorStaffDashboard = () => {
  return (
    <RoleProtectedRoute requiredRole="AUDITOR">
      <DashboardLayout>
        <div>
          <h1>Auditor Dashboard</h1>
          {/* Admin dashboard content */}
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default AuditorStaffDashboard;