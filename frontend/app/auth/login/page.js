"use client"

import React from 'react';
import LoginForm from './LoginForm'; 

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-slate-600 to-slate-600">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h2>
        <LoginForm />  
      </div>
    </div>
  );
};

export default LoginPage;
