import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Table, Floor, Room } from '../types';

const TableManagement: React.FC = () => {
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
    loadTables();
    loadFloors();
  }, [loadFloors]);

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
      <div className="mt-4">
        <div className="w-full h-[600px] bg-gray-800 border-2 border-dashed border-gray-600 overflow-hidden relative"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(75, 85, 99, 0.3) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(75, 85, 99, 0.3) 1px, transparent 1px)
               `,
               backgroundSize: '50px 50px'
             }}
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          
          {/* Floor Plan Label */}
          <div className="absolute top-5 left-5 bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold">
            🍽️ {currentFloor?.name || 'Restaurant'} Floor Plan
          </div>
          
          {/* Tables */}
          {visualTables.map((table) => (
            <div
              key={table.id}
              draggable
              onDragStart={(e) => handleDragStart(e, table)}
              onClick={() => handleTableClick(table)}
              className="absolute cursor-move border-2 border-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              style={{
                left: table.x,
                top: table.y,
                width: table.shape === 'circle' ? (table.radius || 60) * 2 : table.width || 120,
                height: table.shape === 'circle' ? (table.radius || 60) * 2 : table.height || 80,
                backgroundColor: getTableColor(table),
                borderRadius: table.shape === 'circle' ? '50%' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                textAlign: 'center',
                padding: '4px',
                zIndex: 10,
              }}
            >
              <div className="font-bold text-sm">{table.table_number}</div>
              <div className="text-xs opacity-90">{table.table_name || 'Table'}</div>
              <div className="text-xs opacity-80">{table.capacity} seats</div>
              {table.has_active_order && (
                <div className="text-xs font-bold bg-red-600 px-1 rounded mt-1">OCCUPIED</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
          <p className="text-gray-400 text-sm flex-1">
            💡 Drag tables to rearrange them visually • Green = Active, Red = Occupied, Gray = Inactive
            {currentFloor && ` • Showing: ${currentFloor.name}`}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                const filteredTablesForReset = selectedFloor 
                  ? tables.filter(table => table.floor === selectedFloor)
                  : tables;
                  
                const resetTables = filteredTablesForReset.map((table, index) => ({
                  ...table,
                  x: (index % 4) * 200 + 50,
                  y: Math.floor(index / 4) * 150 + 50,
                }));
                setVisualTables(resetTables);
              }}
              className="px-4 py-2 border border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700 rounded transition-colors"
            >
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
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
            >
              Save Layout
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Table Management</h1>
            <p className="text-gray-400">Manage restaurant tables and their visual layout</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {floors.length > 0 && (
              <select
                value={selectedFloor || ''}
                onChange={(e) => setSelectedFloor(Number(e.target.value))}
                className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500 min-w-[200px]"
              >
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            )}
            
            {selectedFloor && rooms.length > 0 && (
              <select
                value={selectedRoom || ''}
                onChange={(e) => setSelectedRoom(Number(e.target.value) || null)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500 min-w-[200px]"
              >
                <option value="">All Rooms</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_name || room.room_number}
                  </option>
                ))}
              </select>
            )}
            
            <div className="flex border border-gray-600 rounded overflow-hidden">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-4 py-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => handleViewModeChange('visual')}
                className={`px-4 py-2 transition-colors ${
                  viewMode === 'visual' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Visual Layout
              </button>
            </div>
            
            <button
              onClick={() => setOpenDialog(true)}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Table
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900 border border-green-700 text-green-200 rounded">
            {success}
          </div>
        )}

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div key={table.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{table.table_number}</h3>
                    <p className="text-gray-400 text-sm">{table.table_name || 'Table'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRegenerateQR(table.id)}
                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Regenerate QR"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Table"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{table.capacity} seats</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      table.has_active_order 
                        ? 'bg-red-900 text-red-200' 
                        : table.is_active 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-gray-700 text-gray-300'
                    }`}>
                      {table.has_active_order ? 'Occupied' : table.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {table.room_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Room:</span>
                      <span className="text-white">{table.room_name}</span>
                    </div>
                  )}
                  {table.shape && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Shape:</span>
                      <span className="text-white capitalize">{table.shape}</span>
                    </div>
                  )}
                  {table.qr_code_url && (
                    <div className="mt-3">
                      <img 
                        src={table.qr_code_url} 
                        alt={`QR Code for ${table.table_number}`}
                        className="w-20 h-20 mx-auto border border-gray-600 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <VisualArrangement />
        )}
      </div>

      {/* Create Table Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add New Table</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Table Number *
                </label>
                <input
                  type="text"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter table number"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Table Name (Optional)
                </label>
                <input
                  type="text"
                  value={newTable.table_name}
                  onChange={(e) => setNewTable({ ...newTable, table_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter table name"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Table Shape
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="rectangle"
                      checked={newTable.shape === 'rectangle'}
                      onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as 'circle' | 'rectangle' })}
                      className="mr-2 text-blue-500"
                    />
                    <span className="text-gray-300">Rectangle</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="circle"
                      checked={newTable.shape === 'circle'}
                      onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as 'circle' | 'rectangle' })}
                      className="mr-2 text-blue-500"
                    />
                    <span className="text-gray-300">Circle</span>
                  </label>
                </div>
              </div>
              
              {newTable.shape === 'rectangle' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Width
                    </label>
                    <input
                      type="number"
                      value={newTable.width}
                      onChange={(e) => setNewTable({ ...newTable, width: parseInt(e.target.value) || 120 })}
                      min="60"
                      max="300"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Height
                    </label>
                    <input
                      type="number"
                      value={newTable.height}
                      onChange={(e) => setNewTable({ ...newTable, height: parseInt(e.target.value) || 80 })}
                      min="40"
                      max="200"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Radius
                  </label>
                  <input
                    type="number"
                    value={newTable.radius}
                    onChange={(e) => setNewTable({ ...newTable, radius: parseInt(e.target.value) || 60 })}
                    min="30"
                    max="150"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              
              {floors.length > 0 && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Floor
                  </label>
                  <select
                    value={newTable.floor}
                    onChange={(e) => setNewTable({ ...newTable, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                  >
                    {floors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedFloor && rooms.length > 0 && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Room
                  </label>
                  <select
                    value={newTable.room || ''}
                    onChange={(e) => setNewTable({ ...newTable, room: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select a Room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_name || room.room_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpenDialog(false)}
                className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Table'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
