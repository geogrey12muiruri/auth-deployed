"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); // Add token state
  const router = useRouter();

  useEffect(() => {
    // Check if the user is already logged in
    const checkUserLoggedIn = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          const response = await axios.get('http://localhost:5000/api/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setUser(response.data.user);
          setToken(accessToken); // Set token
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      setUser({ ...response.data.user, tenantName: response.data.user.tenantId }); // Include tenantName
      setToken(response.data.accessToken); // Set token
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      // Redirect based on user role
      switch (response.data.user.role) {
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TRAINER':
          router.push('/lecturer/dashboard');
          break;
        case 'TRAINEE':
          router.push('/student/dashboard');
          break;
        case 'AUDITOR':
          router.push('/auditor-staff/dashboard');
          break;
        case 'MANAGEMENT_REP':
          router.push('/auditor/dashboard');
          break;
        // Add more cases as needed
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(null);
      setToken(null); // Clear token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/auth/login');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);