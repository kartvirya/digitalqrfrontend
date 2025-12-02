import React, { useState, useEffect } from 'react';
import { BellIcon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';

interface WaiterCall {
  id: string;
  table_number: string;
  table_unique_id: string;
  room_unique_id?: string;
  timestamp: string;
  status: 'pending' | 'acknowledged' | 'completed';
  customer_message?: string;
}

const WaiterCall: React.FC = () => {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [activeCall, setActiveCall] = useState<WaiterCall | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    if (!socket || !isConnected) return;

    // Listen for new waiter calls using custom events
    const handleWaiterCall = (event: CustomEvent) => {
      const call: WaiterCall = event.detail;
      console.log('🔔 New waiter call received:', call);
      setCalls(prev => [call, ...prev]);
      
      // Start ringing for new calls
      if (call.status === 'pending') {
        console.log('🎵 Starting ringtone for call:', call.id);
        setActiveCall(call);
        setIsRinging(true);
        playRingtone();
      }
    };

    const handleWaiterCallUpdate = (event: CustomEvent) => {
      const updatedCall: WaiterCall = event.detail;
      setCalls(prev => prev.map(call => 
        call.id === updatedCall.id ? updatedCall : call
      ));
      
      if (activeCall?.id === updatedCall.id) {
        setActiveCall(updatedCall);
        if (updatedCall.status !== 'pending') {
          setIsRinging(false);
          stopRingtone();
        }
      }
    };

    // Add event listeners
    window.addEventListener('waiterCall', handleWaiterCall as EventListener);
    window.addEventListener('waiterCallUpdate', handleWaiterCallUpdate as EventListener);

    // Join waiters room to receive waiter calls (socket server emits to 'waiters' room)
    console.log('🏠 Joining waiters room for waiter calls...');
    socket.emit('join_room', { room: 'waiters', user_type: 'staff' });

    return () => {
      window.removeEventListener('waiterCall', handleWaiterCall as EventListener);
      window.removeEventListener('waiterCallUpdate', handleWaiterCallUpdate as EventListener);
      if (socket && isConnected) {
        socket.emit('leave_room', { room: 'waiters' });
      }
    };
  }, [socket, isConnected, activeCall]);

  const playRingtone = () => {
    // Use browser notification instead of audio file
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Waiter Call!', {
        body: `Table ${activeCall?.table_number} needs assistance`,
        icon: '/favicon.ico',
        tag: 'waiter-call'
      });
    }
    
    // Try to play a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Store audio context reference to stop later
      (window as any).ringtoneAudio = audioContext;
    } catch (e) {
      console.log('Audio play failed:', e);
    }
  };

  const stopRingtone = () => {
    const audio = (window as any).ringtoneAudio;
    if (audio) {
      if (audio.close) {
        // Web Audio API context
        audio.close();
      } else {
        // HTML5 Audio element
        audio.pause();
        audio.currentTime = 0;
      }
      (window as any).ringtoneAudio = null;
    }
  };

  const acknowledgeCall = (callId: string) => {
    if (!socket) return;

    socket.emit('acknowledge_waiter_call', { call_id: callId });
    setIsRinging(false);
    stopRingtone();
  };

  const completeCall = (callId: string) => {
    if (!socket) return;

    socket.emit('complete_waiter_call', { call_id: callId });
  };

  const dismissCall = () => {
    setActiveCall(null);
    setIsRinging(false);
    stopRingtone();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'acknowledged': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <BellIcon className="h-5 w-5 animate-pulse" />;
      case 'acknowledged': return <PhoneIcon className="h-5 w-5" />;
      case 'completed': return <XMarkIcon className="h-5 w-5" />;
      default: return <BellIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Call Alert */}
      {activeCall && isRinging && (
        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 rounded-xl p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <BellIcon className="h-8 w-8 text-red-300 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Waiter Call!</h3>
                <p className="text-red-300">Table {activeCall.table_number} needs assistance</p>
                {activeCall.customer_message && (
                  <p className="text-red-200 text-sm mt-1">"{activeCall.customer_message}"</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => acknowledgeCall(activeCall.id)}
                className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 hover:bg-green-500/30 transition-colors"
              >
                Accept Call
              </button>
              <button
                onClick={dismissCall}
                className="px-4 py-2 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-300 hover:bg-gray-500/30 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call History */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Calls</h3>
        <div className="space-y-4">
          {calls.length === 0 ? (
            <div className="text-center py-8">
              <BellIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No calls yet</p>
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 border rounded-xl p-4 ${getStatusColor(call.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(call.status)}
                    <div>
                      <h4 className="font-semibold text-white">Table {call.table_number}</h4>
                      <p className="text-sm opacity-80">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </p>
                      {call.customer_message && (
                        <p className="text-sm mt-1 opacity-90">"{call.customer_message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {call.status === 'pending' && (
                      <button
                        onClick={() => acknowledgeCall(call.id)}
                        className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-300 hover:bg-green-500/30 transition-colors text-sm"
                      >
                        Accept
                      </button>
                    )}
                    {call.status === 'acknowledged' && (
                      <button
                        onClick={() => completeCall(call.id)}
                        className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        Complete
                      </button>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      call.status === 'pending' ? 'bg-red-500/30 text-red-200' :
                      call.status === 'acknowledged' ? 'bg-yellow-500/30 text-yellow-200' :
                      'bg-green-500/30 text-green-200'
                    }`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="text-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
            : 'bg-red-500/20 text-red-300 border border-red-500/50'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
};

export default WaiterCall;
