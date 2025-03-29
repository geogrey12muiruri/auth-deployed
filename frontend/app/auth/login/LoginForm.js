"use client";

import React, { useState } from 'react';
import { useAuth } from '../../../context/auth-context';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); // For informational messages like OTP sent
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      await login(email, password);
    } catch (err) {
      if (err.response?.data?.message === 'Email not verified. A new OTP has been sent to your email.') {
        setInfo('Email not verified. Please check your email for the OTP.');
      } else {
        setError(err.response?.data?.message || 'An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your password"
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {info && <p className="text-blue-500 text-sm">{info}</p>}

      <div>
        <button
          type="submit"
          className={`w-full py-3 rounded-md ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex justify-center items-center">
              <svg className="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 1116 0A8 8 0 014 12z" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" />
              </svg>
              Processing...
            </span>
          ) : (
            'Login'
          )}
        </button>
      </div>

      <div className="text-center mt-4">
        <a href="/auth/forgot-password" className="text-blue-600 hover:underline text-sm">
          Forgot your password?
        </a>
      </div>

      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/auth/register" className="text-blue-600 hover:underline">
            Register here
          </a>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;