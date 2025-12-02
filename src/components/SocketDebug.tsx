import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const SocketDebug: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    if (!socket) return;

    addDebugInfo(`Socket connected: ${isConnected}`);

    // Test room joining
    addDebugInfo('Attempting to join staff room...');
    socket.emit('join_room', { room: 'staff', user_type: 'staff' });

    // Listen for room confirmation
    socket.on('room_joined', (data) => {
      addDebugInfo(`Room joined: ${data.room} as ${data.user_type}`);
    });

    // Listen for waiter calls using custom events
    const handleWaiterCall = (event: CustomEvent) => {
      const call = event.detail;
      addDebugInfo(`🔔 Waiter call received: ${call.table_number} - ${call.customer_message}`);
    };

    window.addEventListener('waiterCall', handleWaiterCall as EventListener);

    // Listen for connection events
    socket.on('connect', () => {
      addDebugInfo('Socket connected');
    });

    socket.on('disconnect', () => {
      addDebugInfo('Socket disconnected');
    });

    return () => {
      socket.off('room_joined');
      window.removeEventListener('waiterCall', handleWaiterCall as EventListener);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, isConnected]);

  const testWaiterCall = () => {
    if (!socket) return;
    
    addDebugInfo('Sending test waiter call...');
    socket.emit('waiter_call', {
      table_number: 'Test Table',
      table_unique_id: 'test123',
      message: 'Test call from debug component'
    });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Socket.IO Debug</h3>
      
      <div className="mb-4">
        <button 
          onClick={testWaiterCall}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Waiter Call
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded text-sm font-mono max-h-64 overflow-y-auto">
        {debugInfo.map((info, index) => (
          <div key={index}>{info}</div>
        ))}
      </div>
    </div>
  );
};

export default SocketDebug;
