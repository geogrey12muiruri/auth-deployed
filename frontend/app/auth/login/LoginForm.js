import React, { useState } from 'react';
import { useAuth } from '../../../context/auth-context';
import axios from 'axios';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(''); // State for OTP input
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false); // Toggle OTP input UI
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes countdown for OTP
  const { login } = useAuth();

  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      await login(email, password);
    } catch (err) {
      if (err.response?.data?.message === 'Email not verified. A new OTP has been sent to your email.') {
        setInfo('Your email is not verified. Please enter the OTP sent to your email.');
        setShowOtpStep(true); // Show OTP input
      } else {
        setError(err.response?.data?.message || 'An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const response = await axios.post('http://localhost:5000/api/verify-otp', { email, otp });
      if (response.data.success) {
        setInfo('Email verified successfully! Logging you in...');
        await login(email, password); // Retry login after verification
        setShowOtpStep(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resending OTP
  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    setInfo('');

    try {
      await axios.post('/api/auth/resend-otp', { email });
      setInfo('A new OTP has been sent to your email.');
      setOtpTimer(300); // Reset the timer
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={showOtpStep ? handleVerifyOtp : handleSubmit} className="space-y-6">
      {!showOtpStep ? (
        <>
          {/* Email Input */}
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

          {/* Password Input */}
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
        </>
      ) : (
        /* OTP Input */
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            Enter OTP
          </label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the OTP from your email"
            required
          />
          <div className="mt-2 text-sm text-gray-600">
            {otpTimer > 0 ? (
              <p>OTP expires in {Math.floor(otpTimer / 60)}:{otpTimer % 60 < 10 ? `0${otpTimer % 60}` : otpTimer % 60}</p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-blue-600 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error and Info Messages */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {info && <p className="text-blue-500 text-sm">{info}</p>}

      {/* Submit Button */}
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
          ) : showOtpStep ? (
            'Verify OTP'
          ) : (
            'Login'
          )}
        </button>
      </div>

      {/* Resend OTP Button (only when OTP step is active) */}
      {showOtpStep && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleResendOTP}
            className={`text-blue-600 hover:underline text-sm ${resending ? 'opacity-50' : ''}`}
            disabled={resending}
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
      )}

      {/* Verify Email Link */}
      {!showOtpStep && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setShowOtpStep(true)}
            className="text-blue-600 hover:underline text-sm"
          >
            Verify Email
          </button>
        </div>
      )}

      {/* Forgot Password and Register Links */}
      {!showOtpStep && (
        <>
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
        </>
      )}
    </form>
  );
};

export default LoginForm;