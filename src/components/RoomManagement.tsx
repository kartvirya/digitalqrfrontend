import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { FRONTEND_URL } from '../config';
import { Room, Floor } from '../types';

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');

  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_name: '',
    room_type: 'single',
    floor: 1,
    capacity: 2,
    price_per_night: '',
    room_status: 'available',
    description: '',
    amenities: ''
  });

  // Filter rooms based on selected floor
  const filteredRooms = selectedFloor === 'all' 
    ? rooms 
    : rooms.filter(room => room.floor === selectedFloor);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, floorsData] = await Promise.all([
        apiService.getRooms(),
        apiService.getFloors()
      ]);
      setRooms(roomsData);
      setFloors(floorsData);
    } catch (error) {
      setError('Failed to load rooms and floors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const roomData = {
        ...newRoom,
        price_per_night: parseFloat(newRoom.price_per_night) || 0,
        floor: newRoom.floor
      };
      
      await apiService.createRoom(roomData);
      setSuccess('Room created successfully!');
      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      setError('Failed to create room');
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;
    
    try {
      const roomData = {
        ...newRoom,
        price_per_night: parseFloat(newRoom.price_per_night) || 0,
        floor: newRoom.floor
      };
      
      await apiService.updateRoom(editingRoom.id, roomData);
      setSuccess('Room updated successfully!');
      setOpenDialog(false);
      setEditingRoom(null);
      resetForm();
      loadData();
    } catch (error) {
      setError('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await apiService.deleteRoom(roomId);
        setSuccess('Room deleted successfully!');
        loadData();
      } catch (error) {
        setError('Failed to delete room');
      }
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoom({
      room_number: room.room_number,
      room_name: room.room_name || '',
      room_type: room.room_type,
      floor: room.floor,
      capacity: room.capacity,
      price_per_night: room.price_per_night.toString(),
      room_status: room.room_status,
      description: room.description || '',
      amenities: room.amenities || ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setNewRoom({
      room_number: '',
      room_name: '',
      room_type: 'single',
      floor: 1,
      capacity: 2,
      price_per_night: '',
      room_status: 'available',
      description: '',
      amenities: ''
    });
  };



  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case 'available':
        return {
          backgroundColor: '#065f46',
          color: '#d1fae5',
          border: '1px solid #10b981'
        };
      case 'occupied':
        return {
          backgroundColor: '#991b1b',
          color: '#fecaca',
          border: '1px solid #dc2626'
        };
      case 'maintenance':
        return {
          backgroundColor: '#92400e',
          color: '#fef3c7',
          border: '1px solid #f59e0b'
        };
      case 'reserved':
        return {
          backgroundColor: '#1e40af',
          color: '#dbeafe',
          border: '1px solid #3b82f6'
        };
      case 'cleaning':
        return {
          backgroundColor: '#374151',
          color: '#9ca3af',
          border: '1px solid #6b7280'
        };
      default:
        return {
          backgroundColor: '#374151',
          color: '#9ca3af',
          border: '1px solid #6b7280'
        };
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'single': 'Single Room',
      'double': 'Double Room',
      'triple': 'Triple Room',
      'suite': 'Suite',
      'deluxe': 'Deluxe Room',
      'presidential': 'Presidential Suite'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading rooms...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        mb: 4,
        p: 3,
        backgroundColor: '#1f2937',
        borderRadius: '12px',
        border: '1px solid #374151'
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              color: '#e5e7eb',
              fontWeight: 700,
              fontSize: '2rem',
              mb: 1
            }}
          >
            Room Management
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#9ca3af',
              fontWeight: 500,
              fontSize: '1rem',
              mb: 2
            }}
          >
            {filteredRooms.filter(r => r.room_status === 'occupied').length} of {filteredRooms.length} rooms occupied
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingRoom(null);
            resetForm();
            setOpenDialog(true);
          }}
          sx={{
            backgroundColor: '#3b82f6',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
            '&:hover': {
              backgroundColor: '#2563eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          + ADD ROOM
        </Button>
      </Box>

      {/* Floor Filter */}
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel sx={{ color: '#9ca3af' }}>Filter by Floor</InputLabel>
          <Select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value as number | 'all')}
            label="Filter by Floor"
            sx={{
              backgroundColor: '#374151',
              color: '#e5e7eb',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4b5563',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#6b7280',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3b82f6',
              },
              '& .MuiSelect-icon': {
                color: '#9ca3af',
              },
            }}
          >
            <MuiMenuItem value="all" sx={{ color: '#e5e7eb' }}>All Floors</MuiMenuItem>
            {floors.map((floor) => (
              <MuiMenuItem key={floor.id} value={floor.id} sx={{ color: '#e5e7eb' }}>
                {floor.name}
              </MuiMenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 4,
        mt: 2
      }}>
        {filteredRooms.map((room) => (
          <Box key={room.id}>
            <Card 
              sx={{
                border: room.has_active_order ? '2px solid #dc2626' : '1px solid #374151',
                backgroundColor: room.has_active_order ? '#1f2937' : '#1f2937',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)',
                  backgroundColor: room.has_active_order ? '#374151' : '#374151',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        color: room.has_active_order ? '#f87171' : '#e5e7eb',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        mb: 0.5
                      }}
                    >
                      Room {room.room_number}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#9ca3af',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        mb: 1
                      }}
                    >
                      {room.room_name || getRoomTypeLabel(room.room_type)}
                    </Typography>
                    {room.has_active_order && (
                      <Chip
                        label="HAS ORDER"
                        color="error"
                        size="small"
                        sx={{ 
                          mt: 1,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: '20px'
                        }}
                      />
                    )}
                  </Box>
                  <Chip
                    label={room.room_status.toUpperCase()}
                    size="small"
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: '24px',
                      ...getStatusChipStyle(room.room_status)
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HotelIcon sx={{ mr: 1.5, fontSize: 20, color: '#9ca3af' }} />
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: '#d1d5db',
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    {getRoomTypeLabel(room.room_type)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: '#9ca3af' }} />
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: '#d1d5db',
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    {room.capacity} guests
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon sx={{ mr: 1.5, fontSize: 20, color: '#9ca3af' }} />
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: '#d1d5db',
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    ${room.price_per_night}/night
                  </Typography>
                </Box>

                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 3,
                    color: '#9ca3af',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: '#10b981',
                    display: 'inline-block'
                  }} />
                  Floor: {room.floor_name || `Floor ${room.floor}`}
                </Typography>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 2,
                  pt: 2,
                  borderTop: '1px solid #374151'
                }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Room">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRoom(room)}
                        sx={{
                          backgroundColor: '#374151',
                          color: '#9ca3af',
                          '&:hover': {
                            backgroundColor: '#4b5563',
                            color: '#d1d5db',
                          }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Room">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRoom(room.id)}
                        sx={{
                          backgroundColor: '#374151',
                          color: '#f87171',
                          '&:hover': {
                            backgroundColor: '#4b5563',
                            color: '#fca5a5',
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {room.qr_code_url && (
                    <Tooltip title="Copy QR Code URL">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const url = `${FRONTEND_URL}/?room=${room.qr_unique_id}`;
                          navigator.clipboard.writeText(url);
                          setSuccess('Room QR code URL copied to clipboard!');
                        }}
                        sx={{
                          backgroundColor: '#374151',
                          color: '#60a5fa',
                          '&:hover': {
                            backgroundColor: '#4b5563',
                            color: '#93c5fd',
                          }
                        }}
                      >
                        <QrCodeIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Add/Edit Room Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            '& .MuiDialogTitle-root': {
              color: '#e5e7eb',
              borderBottom: '1px solid #374151',
            },
            '& .MuiDialogContent-root': {
              color: '#e5e7eb',
            },
            '& .MuiDialogActions-root': {
              borderTop: '1px solid #374151',
            },
          }
        }}
      >
        <DialogTitle>
          {editingRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <Box>
              <TextField
                fullWidth
                label="Room Number"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#374151',
                    '& fieldset': {
                      borderColor: '#4b5563',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9ca3af',
                  },
                  '& .MuiInputBase-input': {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Room Name"
                value={newRoom.room_name}
                onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#374151',
                    '& fieldset': {
                      borderColor: '#4b5563',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9ca3af',
                  },
                  '& .MuiInputBase-input': {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Box>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: '#9ca3af' }}>Room Type</InputLabel>
                <Select
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                  sx={{
                    backgroundColor: '#374151',
                    color: '#e5e7eb',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4b5563',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSelect-icon': {
                      color: '#9ca3af',
                    },
                  }}
                >
                  <MuiMenuItem value="single" sx={{ color: '#e5e7eb' }}>Single Room</MuiMenuItem>
                  <MuiMenuItem value="double" sx={{ color: '#e5e7eb' }}>Double Room</MuiMenuItem>
                  <MuiMenuItem value="triple" sx={{ color: '#e5e7eb' }}>Triple Room</MuiMenuItem>
                  <MuiMenuItem value="suite" sx={{ color: '#e5e7eb' }}>Suite</MuiMenuItem>
                  <MuiMenuItem value="deluxe" sx={{ color: '#e5e7eb' }}>Deluxe Room</MuiMenuItem>
                  <MuiMenuItem value="presidential" sx={{ color: '#e5e7eb' }}>Presidential Suite</MuiMenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: '#9ca3af' }}>Floor</InputLabel>
                <Select
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value as number })}
                  sx={{
                    backgroundColor: '#374151',
                    color: '#e5e7eb',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4b5563',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSelect-icon': {
                      color: '#9ca3af',
                    },
                  }}
                >
                  {floors.map((floor) => (
                    <MuiMenuItem key={floor.id} value={floor.id} sx={{ color: '#e5e7eb' }}>
                      {floor.name}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 1 })}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#374151',
                    '& fieldset': {
                      borderColor: '#4b5563',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9ca3af',
                  },
                  '& .MuiInputBase-input': {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Price per Night"
                type="number"
                value={newRoom.price_per_night}
                onChange={(e) => setNewRoom({ ...newRoom, price_per_night: e.target.value })}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#374151',
                    '& fieldset': {
                      borderColor: '#4b5563',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9ca3af',
                  },
                  '& .MuiInputBase-input': {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Box>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: '#9ca3af' }}>Room Status</InputLabel>
                <Select
                  value={newRoom.room_status}
                  onChange={(e) => setNewRoom({ ...newRoom, room_status: e.target.value })}
                  sx={{
                    backgroundColor: '#374151',
                    color: '#e5e7eb',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4b5563',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSelect-icon': {
                      color: '#9ca3af',
                    },
                  }}
                >
                  <MuiMenuItem value="available" sx={{ color: '#e5e7eb' }}>Available</MuiMenuItem>
                  <MuiMenuItem value="occupied" sx={{ color: '#e5e7eb' }}>Occupied</MuiMenuItem>
                  <MuiMenuItem value="maintenance" sx={{ color: '#e5e7eb' }}>Under Maintenance</MuiMenuItem>
                  <MuiMenuItem value="reserved" sx={{ color: '#e5e7eb' }}>Reserved</MuiMenuItem>
                  <MuiMenuItem value="cleaning" sx={{ color: '#e5e7eb' }}>Being Cleaned</MuiMenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#374151',
                    '& fieldset': {
                      borderColor: '#4b5563',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9ca3af',
                  },
                  '& .MuiInputBase-input': {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Amenities (comma separated)"
                value={newRoom.amenities}
                onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                margin="normal"
                placeholder="WiFi, TV, AC, Mini Bar"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#374151',
                    '& fieldset': {
                      borderColor: '#4b5563',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6b7280',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9ca3af',
                  },
                  '& .MuiInputBase-input': {
                    color: '#e5e7eb',
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ color: '#9ca3af' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={editingRoom ? handleUpdateRoom : handleCreateRoom}
            variant="contained"
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            }}
          >
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoomManagement;
