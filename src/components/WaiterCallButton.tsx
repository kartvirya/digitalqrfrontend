import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';

interface WaiterCallButtonProps {
  tableNumber: string;
  tableUniqueId: string;
  roomUniqueId?: string;
}

const WaiterCallButton: React.FC<WaiterCallButtonProps> = ({
  tableNumber,
  tableUniqueId,
  roomUniqueId
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'sent' | 'error'>('idle');
  const { socket, isConnected } = useSocket();

  const handleCallWaiter = () => {
    if (!socket) {
      console.error('Socket not available');
      setCallStatus('error');
      return;
    }

    if (!isConnected) {
      console.error('Socket not connected. Connection status:', isConnected);
      setCallStatus('error');
      return;
    }

    // Validate that we have at least table or room ID
    if (!tableUniqueId && !roomUniqueId) {
      console.error('Missing table_unique_id and room_unique_id');
      setCallStatus('error');
      return;
    }

    setIsCalling(true);
    setCallStatus('calling');

    const callData = {
      table_number: tableNumber || 'Unknown',
      table_unique_id: tableUniqueId || '',
      room_unique_id: roomUniqueId || '',
      message: message || ''
    };

    console.log('Emitting waiter call:', callData);

    // Emit waiter call event
    socket.emit('waiter_call', callData);

    // Set up timeout for response
    let timeoutId: NodeJS.Timeout | null = null;
    timeoutId = setTimeout(() => {
      if (isCalling) {
        console.warn('Waiter call timeout - no response received after 5 seconds');
        setCallStatus('error');
        setIsCalling(false);
      }
    }, 5000);

    // Listen for confirmation
    const handleWaiterCallSent = (data: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.log('✅ Waiter call sent successfully:', data);
      setCallStatus('sent');
      setIsCalling(false);
      setShowMessage(false);
      setMessage('');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setCallStatus('idle');
      }, 3000);
    };

    // Listen for errors
    const handleWaiterCallError = (data: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('❌ Waiter call error:', data);
      setCallStatus('error');
      setIsCalling(false);
    };

    socket.once('waiter_call_sent', handleWaiterCallSent);
    socket.once('waiter_call_error', handleWaiterCallError);

    // Handle general socket errors
    socket.once('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('Socket error:', error);
      setCallStatus('error');
      setIsCalling(false);
    });

    socket.once('connect_error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('Socket connection error:', error);
      setCallStatus('error');
      setIsCalling(false);
    });
  };

  const getButtonContent = () => {
    switch (callStatus) {
      case 'calling':
        return (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Calling...</span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-green-400" />
            <span>Call Sent!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-red-400" />
            <span>Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5" />
            <span>Call Waiter</span>
          </div>
        );
    }
  };

  const getButtonStyle = () => {
    switch (callStatus) {
      case 'calling':
        return 'bg-blue-500 hover:bg-blue-600 animate-pulse';
      case 'sent':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-orange-500 hover:bg-orange-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Waiter Call Button */}
      <button
        onClick={() => setShowMessage(!showMessage)}
        disabled={isCalling || callStatus === 'calling'}
        className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 ${getButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getButtonContent()}
      </button>

      {/* Message Input */}
      {showMessage && (
        <div className="space-y-3 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you need help with?"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {message.length}/200 characters
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCallWaiter}
              disabled={isCalling || callStatus === 'calling'}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalling ? 'Calling...' : 'Send Call'}
            </button>
            <button
              onClick={() => {
                setShowMessage(false);
                setMessage('');
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {callStatus === 'sent' && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
          <p className="text-green-300 text-sm text-center">
            ✅ Waiter call sent successfully! A waiter will be with you shortly.
          </p>
        </div>
      )}

      {callStatus === 'error' && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-300 text-sm text-center">
            ❌ Failed to send waiter call. Please try again.
          </p>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Connection lost. Please refresh the page to call a waiter.
          </p>
        </div>
      )}
    </div>
  );
};

export default WaiterCallButton;
