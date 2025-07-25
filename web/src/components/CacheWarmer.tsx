'use client';

import { useEffect, useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function CacheWarmer() {
  const [status, setStatus] = useState<'idle' | 'warming' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const warmCache = async () => {
    setStatus('warming');
    setMessage('Warming up cache...');
    
    try {
      const response = await fetch('/api/cache/preload', {
        method: 'POST',
      });
      
      if (response.ok) {
        setStatus('success');
        setMessage('Cache warmed successfully!');
      } else {
        throw new Error('Failed to warm cache');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to warm cache');
      console.error('Cache warming error:', error);
    }
  };

  useEffect(() => {
    // Auto-warm cache on component mount
    warmCache();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'warming':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'warming':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Don't render if cache is successfully warmed
  if (status === 'success') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {message}
        </span>
        {status === 'error' && (
          <button
            onClick={warmCache}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
} 