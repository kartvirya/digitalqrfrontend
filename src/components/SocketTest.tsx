import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';

const SocketTest: React.FC = () => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket();
  const [messages, setMessages] = useState<string[]>([]);
  const [testOrderId, setTestOrderId] = useState<number>(1);

  useEffect(() => {
    if (!socket) return;

    // Listen for all events
    const handleWelcome = (data: any) => {
      setMessages(prev => [...prev, `Welcome: ${data.message}`]);
    };

    const handleRoomJoined = (data: any) => {
      setMessages(prev => [...prev, `Room joined: ${data.room} as ${data.user_type}`]);
    };

    const handleOrderUpdate = (data: any) => {
      setMessages(prev => [...prev, `Order updated: #${data.order_id} -> ${data.status}`]);
    };

    const handleNewOrder = (data: any) => {
      setMessages(prev => [...prev, `New order: #${data.order.id}`]);
    };

    socket.on('welcome', handleWelcome);
    socket.on('room_joined', handleRoomJoined);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('welcome', handleWelcome);
      socket.off('room_joined', handleRoomJoined);
      socket.off('order_updated', handleOrderUpdate);
      socket.off('new_order', handleNewOrder);
    };
  }, [socket]);

  const handleJoinAdmin = () => {
    joinRoom('admin', 'admin');
  };

  const handleJoinStaff = () => {
    joinRoom('staff', 'staff');
  };

  const handleTestOrderUpdate = () => {
    if (socket) {
      socket.emit('order_status_update', {
        order_id: testOrderId,
        status: 'preparing',
        user_type: 'admin'
      });
      setTestOrderId(prev => prev + 1);
    }
  };

  const handleTestNewOrder = () => {
    if (socket) {
      socket.emit('new_order_created', {
        order: {
          id: testOrderId,
          name: 'Test Customer',
          status: 'pending',
          price: '100.00'
        }
      });
      setTestOrderId(prev => prev + 1);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Socket.IO Connection Test
      </Typography>

      <Alert 
        severity={isConnected ? 'success' : 'error'} 
        sx={{ mb: 3 }}
      >
        {isConnected ? '✅ Connected to Socket.IO server' : '❌ Disconnected from Socket.IO server'}
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Actions
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleJoinAdmin}
            disabled={!isConnected}
          >
            Join Admin Room
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleJoinStaff}
            disabled={!isConnected}
          >
            Join Staff Room
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleTestOrderUpdate}
            disabled={!isConnected}
          >
            Test Order Update
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleTestNewOrder}
            disabled={!isConnected}
          >
            Test New Order
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={clearMessages}
          >
            Clear Messages
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Messages ({messages.length})
        </Typography>
        
        <Box sx={{ 
          maxHeight: 400, 
          overflowY: 'auto', 
          bgcolor: 'grey.900', 
          p: 2, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          {messages.length === 0 ? (
            <Typography color="text.secondary">
              No messages yet. Try the test actions above.
            </Typography>
          ) : (
            messages.map((message, index) => (
              <Box key={index} sx={{ mb: 1, color: 'text.primary' }}>
                [{new Date().toLocaleTimeString()}] {message}
              </Box>
            ))
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SocketTest;
