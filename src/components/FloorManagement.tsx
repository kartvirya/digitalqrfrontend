import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Floor } from '../types';

const FloorManagement: React.FC = () => {
  const { user } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [newFloor, setNewFloor] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadFloors();
  }, []);

  const loadFloors = async () => {
    try {
      const floorsData = await apiService.getFloors();
      setFloors(floorsData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!newFloor.name.trim()) {
      setError('Floor name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createFloor(newFloor);
      setSuccess('Floor created successfully!');
      setOpenDialog(false);
      setNewFloor({ name: '', description: '' });
      loadFloors();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create floor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFloor = async () => {
    if (!editingFloor || !editingFloor.name.trim()) {
      setError('Floor name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.updateFloor(editingFloor.id, editingFloor);
      setSuccess('Floor updated successfully!');
      setOpenDialog(false);
      setEditingFloor(null);
      loadFloors();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update floor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFloor = async (floorId: number) => {
    if (!window.confirm('Are you sure you want to delete this floor? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteFloor(floorId);
      setSuccess('Floor deleted successfully!');
      loadFloors();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete floor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    setOpenDialog(true);
  };

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-300">You don't have permission to manage floors.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Floor Management</h1>
            <p className="text-gray-400">Manage restaurant floors and their configurations</p>
          </div>
          
          <button
            onClick={() => {
              setEditingFloor(null);
              setNewFloor({ name: '', description: '' });
              setOpenDialog(true);
            }}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ADD NEW FLOOR
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-300">{success}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Floor Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {floors.map((floor) => (
              <div
                key={floor.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/50 group"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {floor.name}
                    </h3>
                    {floor.description && (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {floor.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    floor.is_active 
                      ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                      : 'bg-red-900/30 text-red-300 border border-red-500/30'
                  }`}>
                    {floor.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Floor Stats */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold">Tables: {floor.table_count || 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditFloor(floor)}
                    disabled={loading}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteFloor(floor.id)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && floors.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Floors Found</h3>
              <p className="text-gray-400 mb-6">Get started by creating your first floor.</p>
              <button
                onClick={() => {
                  setEditingFloor(null);
                  setNewFloor({ name: '', description: '' });
                  setOpenDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Create First Floor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Floor Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingFloor ? 'Edit Floor' : 'Add New Floor'}
              </h2>
              <button
                onClick={() => setOpenDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Floor Name *
                </label>
                <input
                  type="text"
                  value={editingFloor ? editingFloor.name : newFloor.name}
                  onChange={(e) => {
                    if (editingFloor) {
                      setEditingFloor({ ...editingFloor, name: e.target.value });
                    } else {
                      setNewFloor({ ...newFloor, name: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter floor name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={editingFloor ? editingFloor.description || '' : newFloor.description}
                  onChange={(e) => {
                    if (editingFloor) {
                      setEditingFloor({ ...editingFloor, description: e.target.value });
                    } else {
                      setNewFloor({ ...newFloor, description: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Enter floor description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpenDialog(false)}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingFloor ? handleUpdateFloor : handleCreateFloor}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingFloor ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingFloor ? 'Update Floor' : 'Create Floor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorManagement;
