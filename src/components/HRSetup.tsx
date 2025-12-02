import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import apiService from '../services/api';
import { UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface HRManager {
  id?: number;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: 'hr_manager';
}

const HRSetup: React.FC = () => {
  const { user } = useAuth();
  const { isRestaurantAdmin } = usePermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hrManagerExists, setHrManagerExists] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<HRManager>({
    phone: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'hr_manager',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    checkHRManager();
  }, []);

  const checkHRManager = async () => {
    try {
      setChecking(true);
      // Check if HR manager user exists for this restaurant
      // We'll check by trying to get current user info which includes restaurant users
      // For now, we'll check if we can access HR endpoints, which would indicate HR is set up
      try {
        // Try to get employees - if this works, HR might be set up
        await apiService.getEmployees();
        // Check if there's a user with hr_manager role
        // We'll make a simple check - if user can access HR, assume HR manager exists
        // In a real scenario, we'd have an endpoint to check for HR manager
        setHrManagerExists(false); // Default to false, let user set it up
      } catch (err) {
        // If we can't access, HR is definitely not set up
        setHrManagerExists(false);
      }
    } catch (err: any) {
      console.error('Error checking HR manager:', err);
      setHrManagerExists(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.phone || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // First, create the user account with hr_manager role
      const userData = {
        phone: formData.phone,
        password: password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'hr_manager',
        restaurant_id: user?.restaurant?.id,
      };

      // Create user via API
      const response = await apiService.post('/api/auth/create_hr_manager/', userData);
      
      setSuccess(`HR Manager account created successfully! Phone: ${formData.phone}, Password: ${password}`);
      setFormData({
        phone: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'hr_manager',
      });
      setPassword('');
      setConfirmPassword('');
      setHrManagerExists(true);
      
      // Optionally navigate to HR login or show instructions
      setTimeout(() => {
        navigate('/hr-login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create HR Manager account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToHRLogin = () => {
    navigate('/hr-login');
  };

  if (!isRestaurantAdmin()) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">Access denied. Only restaurant administrators can set up HR accounts.</p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Checking HR setup status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">HR Manager Setup</h1>
        <p className="text-gray-400">Create an HR Manager account to manage human resources for your restaurant</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}

      {hrManagerExists && !success ? (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">HR Manager Already Set Up</h2>
          <p className="text-gray-300 mb-4">
            An HR Manager account has already been created for this restaurant. You can now sign in to the HR system.
          </p>
          <button
            onClick={handleGoToHRLogin}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Go to HR Login
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    Create HR Manager Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HRSetup;

