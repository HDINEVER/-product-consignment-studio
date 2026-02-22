import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SidebarFilterButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  isSelected: boolean;
  children: React.ReactNode;
}

/**
 * Sidebar filter button with Remotion-style Neobrutalism press-down effect.
 * Uses border-b-4 for 3D raised look, with translateY and border reduction on hover/active.
 */
const SidebarFilterButton: React.FC<SidebarFilterButtonProps> = ({
  isSelected,
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      className={`
        w-full text-left px-4 py-3 rounded-lg font-bold text-sm
        relative overflow-hidden
        border-2 border-b-4
        transition-all duration-150
        ${isSelected 
          ? 'bg-yellow-400 border-black text-black active:border-b-2 active:shadow-none' 
          : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:text-black hover:border-gray-200 hover:border-b-gray-300 active:border-b-2'
        }
        ${className}
      `}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.1 }
      }}
      whileTap={{ 
        y: 4,
        scale: 0.98,
        transition: { duration: 0.05 }
      }}
      style={{
        // When hovered/tapped, the border-bottom effectively reduces visually
        // This is managed via the translate rather than actual border change for smoother animation
      }}
      {...props}
    >
      {/* Shimmer effect for selected state */}
      {isSelected && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['200% center', '-200% center'],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'linear',
          }}
        />
      )}
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default SidebarFilterButton;
