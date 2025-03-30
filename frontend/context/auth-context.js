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
  const checkUserLoggedIn = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        console.log('Access token found:', accessToken);
        const response = await axios.get('http://localhost:5000/api/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('Response from /me:', response.data);

        // Extract roleName from the role object
        const roleName = response.data.user.role?.name;

        // Include tenantName and roleName in the user object
        setUser({
          ...response.data.user,
          roleName, // Add roleName explicitly
        });

        setToken(accessToken); // Set token
      } else {
        console.log('No access token found.');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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

      // Log the full response for debugging
      console.log('Login Response:', response.data);

      // Directly use roleName from the response
      const roleName = response.data.user.roleName;

      // Include tenantName and roleName in the user object
      setUser({
        ...response.data.user,
        roleName, // Add roleName explicitly
      });

      setToken(response.data.accessToken); // Set token
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      // Redirect based on user roleName
      switch (roleName) { // Use roleName for routing
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        case 'STAFF':
          router.push('/lecturer/dashboard');
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
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
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