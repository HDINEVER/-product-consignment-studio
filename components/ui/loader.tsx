import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ className, size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const innerSizeClasses = {
    sm: 'w-3 h-3 text-[8px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('billiard-loader', sizeClasses[size])}>
        <div className={cn('billiard-loader-inner', innerSizeClasses[size])}>8</div>
      </div>
      {text && <p className="font-bold text-gray-600">{text}</p>}
    </div>
  );
};

export default Loader;
