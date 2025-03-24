"use client";

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 text-white p-4">
          {/* Navigation bar content */}
          <Navbar />
          {/* Add navigation links here */}
        </header>
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;