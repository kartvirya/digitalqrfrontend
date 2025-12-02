import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import apiService from '../services/api';
import { Restaurant } from '../context/RestaurantContext';

const RestaurantManagement: React.FC = () => {
  const { user } = useAuth();
  const { restaurants, loadRestaurants } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
    admin_phone: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: '',
  });

  useEffect(() => {
    if (user?.is_super_admin || user?.is_superuser) {
      loadRestaurants();
      setLoading(false);
    }
  }, [user, loadRestaurants]);

  const handleCreateRestaurant = async () => {
    // Validate required fields
    if (!newRestaurant.name || !newRestaurant.slug) {
      setError('Restaurant name and slug are required');
      return;
    }
    
    if (!newRestaurant.admin_phone || !newRestaurant.admin_password) {
      setError('Admin phone number and password are required');
      return;
    }
    
    try {
      const response = await apiService.createRestaurant(newRestaurant);
      const adminPhone = newRestaurant.admin_phone;
      setSuccess(`Restaurant created successfully! Admin login: Phone: ${adminPhone}, Password: ${newRestaurant.admin_password}`);
      setOpenDialog(false);
      setNewRestaurant({
        name: '',
        slug: '',
        address: '',
        phone: '',
        email: '',
        is_active: true,
        admin_phone: '',
        admin_password: '',
        admin_first_name: '',
        admin_last_name: '',
      });
      loadRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create restaurant');
    }
  };

  const handleUpdateRestaurant = async () => {
    if (!editingRestaurant) return;
    try {
      await apiService.updateRestaurant(editingRestaurant.id, editingRestaurant);
      setSuccess('Restaurant updated successfully');
      setOpenDialog(false);
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update restaurant');
    }
  };

  const handleDeleteRestaurant = async (restaurantId: number) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await apiService.deleteRestaurant(restaurantId);
        setSuccess('Restaurant deleted successfully');
        loadRestaurants();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete restaurant');
      }
    }
  };

  const handleActivateRestaurant = async (restaurantId: number) => {
    try {
      await apiService.activateRestaurant(restaurantId);
      setSuccess('Restaurant status updated successfully');
      loadRestaurants();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update restaurant status');
    }
  };

  if (!user?.is_super_admin && !user?.is_superuser) {
    return (
      <div className="max-w-7xl mx-auto mt-8 mb-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Access Denied. Only super administrators can access this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto mt-8 mb-8 px-4">
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 mb-8 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
            <p className="text-gray-600 mt-2">Manage all restaurants in the system</p>
          </div>
          <button
            onClick={() => {
              setEditingRestaurant(null);
              setOpenDialog(true);
            }}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Restaurant
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Restaurants List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {restaurant.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {restaurant.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      restaurant.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingRestaurant(restaurant);
                        setOpenDialog(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleActivateRestaurant(restaurant.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      {restaurant.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteRestaurant(restaurant.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingRestaurant ? editingRestaurant.name : newRestaurant.name}
                  onChange={(e) => {
                    if (editingRestaurant) {
                      setEditingRestaurant({ ...editingRestaurant, name: e.target.value });
                    } else {
                      setNewRestaurant({ ...newRestaurant, name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={editingRestaurant ? editingRestaurant.slug : newRestaurant.slug}
                  onChange={(e) => {
                    if (editingRestaurant) {
                      setEditingRestaurant({ ...editingRestaurant, slug: e.target.value });
                    } else {
                      setNewRestaurant({ ...newRestaurant, slug: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={editingRestaurant ? editingRestaurant.address || '' : newRestaurant.address}
                  onChange={(e) => {
                    if (editingRestaurant) {
                      setEditingRestaurant({ ...editingRestaurant, address: e.target.value });
                    } else {
                      setNewRestaurant({ ...newRestaurant, address: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingRestaurant ? editingRestaurant.phone || '' : newRestaurant.phone}
                    onChange={(e) => {
                      if (editingRestaurant) {
                        setEditingRestaurant({ ...editingRestaurant, phone: e.target.value });
                      } else {
                        setNewRestaurant({ ...newRestaurant, phone: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingRestaurant ? editingRestaurant.email || '' : newRestaurant.email}
                    onChange={(e) => {
                      if (editingRestaurant) {
                        setEditingRestaurant({ ...editingRestaurant, email: e.target.value });
                      } else {
                        setNewRestaurant({ ...newRestaurant, email: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Restaurant Admin Account Section - Only show when creating */}
              {!editingRestaurant && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Restaurant Admin Account</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Create an admin account for this restaurant. This account will be able to manage the restaurant.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin First Name</label>
                      <input
                        type="text"
                        value={newRestaurant.admin_first_name}
                        onChange={(e) => {
                          setNewRestaurant({ ...newRestaurant, admin_first_name: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Last Name</label>
                      <input
                        type="text"
                        value={newRestaurant.admin_last_name}
                        onChange={(e) => {
                          setNewRestaurant({ ...newRestaurant, admin_last_name: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone Number *</label>
                    <input
                      type="tel"
                      value={newRestaurant.admin_phone}
                      onChange={(e) => {
                        setNewRestaurant({ ...newRestaurant, admin_phone: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="1234567890"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used to login as restaurant admin</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                    <input
                      type="password"
                      value={newRestaurant.admin_password}
                      onChange={(e) => {
                        setNewRestaurant({ ...newRestaurant, admin_password: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Password for the restaurant admin account</p>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setOpenDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={editingRestaurant ? handleUpdateRestaurant : handleCreateRestaurant}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg"
              >
                {editingRestaurant ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;

