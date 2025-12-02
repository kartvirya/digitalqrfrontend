import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant, Restaurant } from '../context/RestaurantContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'restaurant'>('credentials');
  const [availableRestaurants, setAvailableRestaurants] = useState<Partial<Restaurant>[]>([]);
  const [selectedRestaurantSlug, setSelectedRestaurantSlug] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { login } = useAuth();
  const { setRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async () => {
    if (!phone || !password) {
      setError('Please enter both phone number and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // First, authenticate to get user info and available restaurants
      const response = await apiService.login(phone, password);
      const userData = response;
      
      // Check if user is super admin and has available restaurants
      if ((userData.is_super_admin || userData.is_superuser) && userData.available_restaurants && userData.available_restaurants.length > 0) {
        setIsSuperAdmin(true);
        setAvailableRestaurants(userData.available_restaurants);
        setStep('restaurant');
      } else {
        // Regular user or restaurant admin - complete login with their restaurant
        // Restaurant admin will have restaurant in userData.restaurant
        await handleCompleteLogin(userData.restaurant);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLogin = async (restaurant?: any) => {
    try {
      setLoading(true);
      setError('');
      
      // Login with optional restaurant selection
      const loginData: any = { phone, password };
      if (selectedRestaurantSlug) {
        loginData.restaurant_slug = selectedRestaurantSlug;
      }
      
      const userData = await login(loginData);
      
      // Set restaurant context
      if (restaurant || (userData as any).restaurant) {
        const restaurantData = restaurant || (userData as any).restaurant;
        if (restaurantData) {
          setRestaurant({
            id: restaurantData.id,
            name: restaurantData.name,
            slug: restaurantData.slug,
            is_active: restaurantData.is_active,
            subscription_status: restaurantData.subscription_status || 'active',
            created_at: restaurantData.created_at || new Date().toISOString(),
            updated_at: restaurantData.updated_at || new Date().toISOString(),
          });
        }
      } else if (selectedRestaurantSlug && availableRestaurants.length > 0) {
        const selectedRestaurant = availableRestaurants.find(r => r.slug === selectedRestaurantSlug);
        if (selectedRestaurant && selectedRestaurant.id && selectedRestaurant.name && selectedRestaurant.slug) {
          setRestaurant({
            id: selectedRestaurant.id,
            name: selectedRestaurant.name,
            slug: selectedRestaurant.slug,
            is_active: selectedRestaurant.is_active ?? true,
            subscription_status: selectedRestaurant.subscription_status || 'active',
            created_at: selectedRestaurant.created_at || new Date().toISOString(),
            updated_at: selectedRestaurant.updated_at || new Date().toISOString(),
          });
        }
      }
      
      // Small delay to ensure state is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate based on user type
      if ((userData as any).is_super_admin || (userData as any).is_superuser) {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSelect = async () => {
    if (!selectedRestaurantSlug) {
      setError('Please select a restaurant');
      return;
    }
    await handleCompleteLogin();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'credentials') {
        handleCredentialsSubmit();
      } else {
        handleRestaurantSelect();
      }
    }
  };

  const handleOAuthLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    setError(`${provider} login is not implemented yet. Please use phone and password.`);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center transform rotate-12">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded"></div>
          </div>
        </div>

        {/* Sign in heading */}
        <h1 className="text-white text-3xl font-semibold text-center mb-8">
          {step === 'restaurant' ? 'Select Restaurant' : 'Sign in'}
        </h1>

        {/* Login Form */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === 'credentials' ? (
            <div className="space-y-6">
              {/* Phone Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your phone number"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your password"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
                />
              </div>

              {/* Continue Button */}
              <button
                onClick={handleCredentialsSubmit}
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Restaurant Selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">
                  Select Restaurant / Hotel
                </label>
                <select
                  value={selectedRestaurantSlug}
                  onChange={(e) => setSelectedRestaurantSlug(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
                >
                  <option value="">-- Select a restaurant --</option>
                  {availableRestaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.slug}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-2">
                  Choose which restaurant/hotel you want to manage
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleRestaurantSelect}
                  disabled={loading || !selectedRestaurantSlug}
                  className="flex-1 bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="px-4 text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => handleOAuthLogin('Google')}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-700 rounded-lg text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center mt-8">
            <span className="text-gray-400">Don't have an account? </span>
            <button 
              onClick={() => navigate('/signup')}
              className="text-white hover:text-gray-300 font-medium transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

