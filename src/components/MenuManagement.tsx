import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import apiService from '../services/api';
import { MenuItem as MenuItemType } from '../types';

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const { restaurant } = useRestaurant();
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    description: '',
    price: '0',
    is_available: true,
  });

  useEffect(() => {
    if (restaurant) {
      apiService.setRestaurantContext(restaurant.id);
      apiService.setRestaurantSlug(restaurant.slug);
    }
    loadMenuItems();
  }, [restaurant]);

  const loadMenuItems = async () => {
    try {
      const data = await apiService.getMenuItems();
      setMenuItems(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    try {
      await apiService.createMenuItem(newItem);
      setSuccess('Menu item created successfully');
      setOpenDialog(false);
      setNewItem({
        name: '',
        category: '',
        description: '',
        price: '0',
        is_available: true,
      });
      loadMenuItems();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create menu item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      await apiService.updateMenuItem(editingItem.id, editingItem);
      setSuccess('Menu item updated successfully');
      setOpenDialog(false);
      setEditingItem(null);
      loadMenuItems();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update menu item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await apiService.deleteMenuItem(itemId);
        setSuccess('Menu item deleted successfully');
        loadMenuItems();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete menu item');
      }
    }
  };

  const handleEditItem = (item: MenuItemType) => {
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setEditingItem(null);
    setOpenDialog(true);
  };

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <div className="max-w-4xl mx-auto mt-8 mb-8 px-4">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600">
          You don't have permission to access menu management.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 mb-8 px-4">
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className=" mx-auto mt-8 mb-8 px-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
        <button
          onClick={handleOpenCreateDialog}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ADD MENU ITEM
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            {/* Image */}
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover rounded-t-lg border-b border-gray-200"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-t-lg border-b border-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image available</span>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                {item.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                {item.description}
              </p>

              {/* Info Section */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Category</span>
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Price</span>
                  <span className="text-lg font-semibold text-gray-700">
                    ₹{Number(item.price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  item.is_available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
            </div>

            {/* Dialog Content */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editingItem ? editingItem.name : newItem.name}
                      onChange={(e) => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, name: e.target.value });
                        } else {
                          setNewItem({ ...newItem, name: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={editingItem ? editingItem.category : newItem.category}
                      onChange={(e) => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, category: e.target.value });
                        } else {
                          setNewItem({ ...newItem, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={editingItem ? editingItem.price : newItem.price}
                      onChange={(e) => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, price: e.target.value });
                        } else {
                          setNewItem({ ...newItem, price: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability
                    </label>
                    <select
                      value={editingItem ? editingItem.is_available.toString() : newItem.is_available.toString()}
                      onChange={(e) => {
                        if (editingItem) {
                          setEditingItem({ ...editingItem, is_available: e.target.value === 'true' });
                        } else {
                          setNewItem({ ...newItem, is_available: e.target.value === 'true' });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="true">Available</option>
                      <option value="false">Unavailable</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={8}
                    value={editingItem ? editingItem.description : newItem.description}
                    onChange={(e) => {
                      if (editingItem) {
                        setEditingItem({ ...editingItem, description: e.target.value });
                      } else {
                        setNewItem({ ...newItem, description: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setOpenDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleCreateItem}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
