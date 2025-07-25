import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingIndicator({ 
  message = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'h-16',
    md: 'h-32',
    lg: 'h-64'
  };

  return (
    <div className={`flex justify-center items-center ${containerClasses[size]} ${className}`}>
      <div className="text-center">
        <Loader2 className={`animate-spin mx-auto mb-4 text-blue-600 ${sizeClasses[size]}`} />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function PageLoadingIndicator() {
  return <LoadingIndicator message="Loading page..." size="lg" />;
}

export function DataLoadingIndicator() {
  return <LoadingIndicator message="Loading data..." size="md" />;
}

export function SmallLoadingIndicator() {
  return <LoadingIndicator message="Loading..." size="sm" />;
} 