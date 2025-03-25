"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Correct import for client-side routing

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TRAINEE'); // Default role
  const [tenantId, setTenantId] = useState(''); // Updated to use tenantId
  const [tenantName, setTenantName] = useState(''); // New state for tenantName
  const [tenants, setTenants] = useState([]); // State to store fetched tenants
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Registration, 2: OTP Verification
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes countdown
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); // Using useRouter from next/navigation

  useEffect(() => {
    let timer;
    if (step === 2 && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  useEffect(() => {
    // Fetch tenants when the component mounts
    const fetchTenants = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/tenants');
        setTenants(response.data);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      }
    };

    fetchTenants();
  }, []);

  const handleTenantChange = (e) => {
    const selectedTenantId = e.target.value;
    setTenantId(selectedTenantId);

    // Find the tenant name based on the selected tenantId
    const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);
    setTenantName(selectedTenant ? selectedTenant.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === 1) {
        // Post request to the backend for registration
        const response = await axios.post('http://localhost:5000/api/register', {
          email,
          password,
          role,
          tenantId,
          tenantName, // Include tenantName in the payload
        });
        setStep(2); // Move to OTP verification step
      } else if (step === 2) {
        // Post request to the backend for OTP verification
        const response = await axios.post('http://localhost:5000/api/verify-otp', { email, otp });
        router.push('/auth/login'); // Redirect user after successful verification
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/resend-otp', { email });
      setOtpTimer(300); // Reset the timer
    } catch (err) {
      setError(err.response?.data?.message || 'Error resending OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
          {step === 1 ? 'Create Account' : 'Verify Your Email'}
        </h1>
        
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 py-2 text-gray-600"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-600">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TRAINER">Trainer</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="MANAGEMENT_REP">Management Rep</option>
                </select>
              </div>

              <div>
                <label htmlFor="tenantId" className="block text-sm font-medium text-gray-600">Institution</label>
                <select
                  id="tenantId"
                  value={tenantId}
                  onChange={handleTenantChange} // Use the new handler
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Institution</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-600">OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter the OTP sent to your email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="mt-2 text-sm text-gray-600">
                {otpTimer > 0 ? (
                  <p>OTP expires in {Math.floor(otpTimer / 60)}:{otpTimer % 60 < 10 ? `0${otpTimer % 60}` : otpTimer % 60}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {loading ? (
              <span className="flex justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 4"></path>
                </svg>
              </span>
            ) : (
              step === 1 ? 'Register' : 'Verify OTP'
            )}
          </button>
        </form>

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/auth/login" className="text-blue-600 hover:underline">Login</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}