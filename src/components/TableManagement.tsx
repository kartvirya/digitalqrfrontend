import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import apiService from '../services/api';
import { Table, Floor, Room } from '../types';

const TableManagement: React.FC = () => {
  const { restaurant } = useRestaurant();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'visual'>('grid');
  
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  
  const [newTable, setNewTable] = useState({
    table_number: '',
    table_name: '',
    capacity: 4,
    floor: 1,
    room: undefined as number | undefined,
    shape: 'rectangle' as 'circle' | 'rectangle',
    width: 120,
    height: 80,
    radius: 60,
  });

  const [visualTables, setVisualTables] = useState<Array<Table & { x: number; y: number }>>([]);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const loadFloors = useCallback(async () => {
    try {
      const floorsData = await apiService.getFloors();
      setFloors(floorsData);
      if (floorsData.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsData[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load floors:', error);
    }
  }, [selectedFloor]);

  const loadRooms = useCallback(async (floorId: number) => {
    try {
      const roomsData = await apiService.getRoomsByFloor(floorId);
      setRooms(roomsData);
    } catch (error: any) {
      console.error('Failed to load rooms:', error);
    }
  }, []);

  useEffect(() => {
    if (restaurant) {
      apiService.setRestaurantContext(restaurant.id);
      apiService.setRestaurantSlug(restaurant.slug);
    }
    loadTables();
    loadFloors();
  }, [restaurant, loadFloors]);

  useEffect(() => {
    if (selectedFloor) {
      loadRooms(selectedFloor);
      setSelectedRoom(null); // Reset room selection when floor changes
    }
  }, [selectedFloor, loadRooms]);

  useEffect(() => {
    if (viewMode === 'visual') {
      const filteredTablesForVisual = selectedFloor 
        ? tables.filter(table => table.floor === selectedFloor)
        : tables;
      
      setVisualTables(filteredTablesForVisual.map(table => ({
        ...table,
        x: table.visual_x || 0,
        y: table.visual_y || 0,
        shape: table.shape || 'rectangle',
        width: table.width || 120,
        height: table.height || 80,
        radius: table.radius || 60,
      })));
    }
  }, [tables, viewMode, selectedFloor]);

  useEffect(() => {
    if (tables.length > 0 && visualTables.length === 0) {
      const filteredTablesForVisual = selectedFloor 
        ? tables.filter(table => table.floor === selectedFloor)
        : tables;
        
      const initialVisualTables = filteredTablesForVisual.map((table, index) => ({
        ...table,
        x: table.visual_x || (index % 4) * 200 + 50,
        y: table.visual_y || Math.floor(index / 4) * 150 + 50,
        shape: table.shape || 'rectangle',
        width: table.width || 120,
        height: table.height || 80,
        radius: table.radius || 60,
      }));
      setVisualTables(initialVisualTables);
    }
  }, [tables, selectedFloor, visualTables.length]);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const tablesData = await apiService.getTables();
      setTables(tablesData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredTables = selectedFloor 
    ? tables.filter(table => {
        const floorMatch = table.floor === selectedFloor;
        if (selectedRoom) {
          return floorMatch && table.room === selectedRoom;
        }
        return floorMatch;
      })
    : tables;

  const handleViewModeChange = (newViewMode: 'grid' | 'visual') => {
    setViewMode(newViewMode);
  };

  const handleSubmit = async () => {
    if (!newTable.table_number.trim()) {
      setError('Table number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createTable({
        ...newTable,
        floor: selectedFloor || floors[0]?.id || 1,
        room: selectedRoom || undefined,
      });
      setSuccess('Table created successfully!');
      setNewTable({ 
        table_number: '', 
        table_name: '', 
        capacity: 4, 
        floor: 1,
        room: undefined,
        shape: 'rectangle',
        width: 120,
        height: 80,
        radius: 60,
      });
      setSelectedRoom(null);
      setOpenDialog(false);
      loadTables();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQR = async (tableId: number) => {
    setLoading(true);
    setError('');

    try {
      await apiService.regenerateQR(tableId);
      setSuccess('QR code regenerated successfully!');
      loadTables();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!window.confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteTable(tableId);
      setSuccess('Table deleted successfully!');
      loadTables();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete table');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setVisualTables(prev => prev.map(table => 
      table.id === draggedTable.id 
        ? { ...table, x, y }
        : table
    ));
    setDraggedTable(null);
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
  };

  const getTableColor = (table: Table) => {
    if (table.has_active_order) return '#ef4444';
    if (table.is_active) return '#10b981';
    return '#6b7280';
  };

  const VisualArrangement: React.FC = () => {
    const currentFloor = floors.find(f => f.id === selectedFloor);
    
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Visual Floor Plan - {currentFloor?.name || 'Restaurant'}
          </h3>
          <p className="text-gray-400 text-sm mt-1">Drag and drop tables to arrange your restaurant layout</p>
        </div>
        
        <div className="relative">
          <div className="w-full h-[650px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-4 border-dashed border-gray-600/50 overflow-hidden relative"
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '50px 50px'
               }}
               onDragOver={handleDragOver}
               onDrop={handleDrop}>
            
            {/* Floor Plan Header */}
            <div className="absolute top-6 left-6 z-20">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg border border-blue-500/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍽️</span>
                  <div>
                    <div className="font-semibold">{currentFloor?.name || 'Restaurant'}</div>
                    <div className="text-xs text-blue-200">Floor Plan</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="absolute top-6 right-6 z-20">
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-gray-300 mb-2">Status Legend</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Active</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Occupied</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-300">Inactive</span>
                </div>
              </div>
            </div>
            
            {/* Tables */}
            {visualTables.map((table) => (
              <div
                key={table.id}
                draggable
                onDragStart={(e) => handleDragStart(e, table)}
                onClick={() => handleTableClick(table)}
                className="absolute cursor-move border-2 border-white/70 shadow-2xl transition-all duration-200 hover:scale-110 hover:shadow-3xl hover:border-white hover:z-30 group"
                style={{
                  left: table.x,
                  top: table.y,
                  width: table.shape === 'circle' ? (table.radius || 60) * 2 : table.width || 120,
                  height: table.shape === 'circle' ? (table.radius || 60) * 2 : table.height || 80,
                  backgroundColor: getTableColor(table),
                  borderRadius: table.shape === 'circle' ? '50%' : '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  textAlign: 'center',
                  padding: '8px',
                  zIndex: 10,
                  background: table.shape === 'circle' 
                    ? `radial-gradient(circle, ${getTableColor(table)}, ${getTableColor(table)}dd)`
                    : `linear-gradient(135deg, ${getTableColor(table)}, ${getTableColor(table)}dd)`,
                }}
              >
                <div className="font-bold text-sm group-hover:scale-110 transition-transform">#{table.table_number}</div>
                <div className="text-xs opacity-90 truncate w-full">{table.table_name || 'Table'}</div>
                <div className="text-xs opacity-80">{table.capacity} seats</div>
                {table.has_active_order && (
                  <div className="text-xs font-bold bg-red-600 px-2 py-1 rounded mt-1 animate-pulse">
                    OCCUPIED
                  </div>
                )}
                {table.room_name && (
                  <div className="text-xs opacity-70 truncate w-full">📍 {table.room_name}</div>
                )}
              </div>
            ))}
            
            {visualTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No Tables to Display</p>
                  <p className="text-sm">Add tables to see them in the visual layout</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="text-gray-400 text-sm flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Layout Tips:</span>
              </div>
              <ul className="text-xs space-y-1 ml-6">
                <li>• Drag tables to rearrange them visually</li>
                <li>• Green = Active, Red = Occupied, Gray = Inactive</li>
                <li>• Click "Save Layout" to persist your changes</li>
                {currentFloor && <li>• Currently viewing: {currentFloor.name}</li>}
              </ul>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  const filteredTablesForReset = selectedFloor 
                    ? tables.filter(table => table.floor === selectedFloor)
                    : tables;
                    
                  const resetTables = filteredTablesForReset.map((table, index) => ({
                    ...table,
                    x: (index % 5) * 150 + 80,
                    y: Math.floor(index / 5) * 120 + 80,
                  }));
                  setVisualTables(resetTables);
                }}
                className="px-4 py-2 border border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Layout
              </button>
              <button
                onClick={async () => {
                  try {
                    for (const table of visualTables) {
                      await apiService.updateTablePosition(table.id, table.x, table.y);
                    }
                    setSuccess('Layout saved successfully!');
                  } catch (error) {
                    setError('Failed to save layout');
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Layout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-blue-500 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M8 7h8" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Loading Tables</h2>
              <p className="text-gray-400">Please wait while we fetch your restaurant data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M8 7h8" />
                </svg>
                Table Management
              </h1>
              <p className="text-gray-400 text-lg">Manage restaurant tables and their visual layout</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto min-w-0">
              {floors.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedFloor || ''}
                    onChange={(e) => setSelectedFloor(Number(e.target.value))}
                    className="px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] sm:min-w-[180px]"
                  >
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        📍 {floor.name}
                      </option>
                    ))}
                  </select>
                  
                  {selectedFloor && rooms.length > 0 && (
                    <select
                      value={selectedRoom || ''}
                      onChange={(e) => setSelectedRoom(Number(e.target.value) || null)}
                      className="px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px] sm:min-w-[180px]"
                    >
                      <option value="">🏠 All Rooms</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          🚪 {room.room_name || room.room_number}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <div className="flex bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`px-4 py-2.5 transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => handleViewModeChange('visual')}
                    className={`px-4 py-2.5 transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'visual' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Layout
                  </button>
                </div>
                
                <button
                  onClick={() => setOpenDialog(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 ml-0 sm:ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg backdrop-blur-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700/50 text-green-200 rounded-lg backdrop-blur-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredTables.map((table) => (
              <div key={table.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-xl hover:transform hover:scale-105 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        #{table.table_number}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        table.has_active_order 
                          ? 'bg-red-500 animate-pulse' 
                          : table.is_active 
                            ? 'bg-green-500' 
                            : 'bg-gray-500'
                      }`} />
                    </div>
                    <p className="text-gray-400 text-sm truncate">{table.table_name || 'Unnamed Table'}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleRegenerateQR(table.id)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                      title="Regenerate QR Code"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200"
                      title="Delete Table"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Capacity:
                      </span>
                      <span className="text-white font-medium">{table.capacity} seats</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        table.has_active_order 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : table.is_active 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {table.has_active_order ? '🔴 Occupied' : table.is_active ? '🟢 Active' : '⚫ Inactive'}
                      </span>
                    </div>
                    {table.room_name && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Room:
                        </span>
                        <span className="text-white font-medium">{table.room_name}</span>
                      </div>
                    )}
                    {table.shape && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Shape:</span>
                        <span className="text-white font-medium capitalize flex items-center gap-1">
                          {table.shape === 'circle' ? '⭕' : '⬜'} {table.shape}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {table.qr_code_url && (
                    <div className="bg-white rounded-lg p-3 flex justify-center">
                      <img 
                        src={table.qr_code_url} 
                        alt={`QR Code for ${table.table_number}`}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredTables.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-16 px-6">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M8 7h8" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Tables Found</h3>
                  <p className="text-gray-500 mb-6">
                    {selectedFloor || selectedRoom 
                      ? "No tables found for the selected floor/room." 
                      : "Get started by creating your first table."
                    }
                  </p>
                  <button
                    onClick={() => setOpenDialog(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Create First Table
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <VisualArrangement />
        )}
      </div>

      {/* Create Table Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
            {/* Dialog Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Add New Table</h2>
                    <p className="text-gray-400 text-sm">Create a new table for your restaurant</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenDialog(false)}
                  className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Table Number *
                  </label>
                  <input
                    type="text"
                    value={newTable.table_number}
                    onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., T001"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 4 })}
                    min="1"
                    max="20"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Table Name (Optional)
                </label>
                <input
                  type="text"
                  value={newTable.table_name}
                  onChange={(e) => setNewTable({ ...newTable, table_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="e.g., Window Table, VIP Table"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Table Shape
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                    <input
                      type="radio"
                      value="rectangle"
                      checked={newTable.shape === 'rectangle'}
                      onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as 'circle' | 'rectangle' })}
                      className="mr-3 text-green-500 focus:ring-green-500"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-4 bg-green-500 rounded-sm"></div>
                      <span className="text-gray-300">Rectangle</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                    <input
                      type="radio"
                      value="circle"
                      checked={newTable.shape === 'circle'}
                      onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as 'circle' | 'rectangle' })}
                      className="mr-3 text-green-500 focus:ring-green-500"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">Circle</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {newTable.shape === 'rectangle' ? (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Table Dimensions (pixels)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Width</label>
                      <input
                        type="number"
                        value={newTable.width}
                        onChange={(e) => setNewTable({ ...newTable, width: parseInt(e.target.value) || 120 })}
                        min="60"
                        max="300"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Height</label>
                      <input
                        type="number"
                        value={newTable.height}
                        onChange={(e) => setNewTable({ ...newTable, height: parseInt(e.target.value) || 80 })}
                        min="40"
                        max="200"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Table Radius (pixels)
                  </label>
                  <input
                    type="number"
                    value={newTable.radius}
                    onChange={(e) => setNewTable({ ...newTable, radius: parseInt(e.target.value) || 60 })}
                    min="30"
                    max="150"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {floors.length > 0 && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Floor
                    </label>
                    <select
                      value={newTable.floor}
                      onChange={(e) => setNewTable({ ...newTable, floor: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      {floors.map((floor) => (
                        <option key={floor.id} value={floor.id}>
                          📍 {floor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedFloor && rooms.length > 0 && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Room (Optional)
                    </label>
                    <select
                      value={newTable.room || ''}
                      onChange={(e) => setNewTable({ ...newTable, room: Number(e.target.value) || undefined })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">🏠 No Room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          🚪 {room.room_name || room.room_number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dialog Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenDialog(false)}
                  className="flex-1 px-4 py-3 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Table
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
