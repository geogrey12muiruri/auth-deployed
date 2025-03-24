"use client";

import React from 'react';
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const StudentDashboard = () => {
  return (
    <RoleProtectedRoute requiredRole="STUDENT">
      <DashboardLayout>
        <div>
          <h1>Student Dashboard</h1>
          {/* Student dashboard content */}
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default StudentDashboard;