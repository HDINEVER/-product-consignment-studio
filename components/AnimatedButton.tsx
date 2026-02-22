import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  hasShimmer?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-black text-white 
    border-2 border-black border-b-4
    shadow-[0_4px_0_0_rgba(0,0,0,1)]
    hover:shadow-[0_6px_0_0_rgba(0,0,0,1)]
    active:shadow-none
    active:border-b-2
  `,
  secondary: `
    bg-yellow-400 text-black 
    border-2 border-black border-b-4
    shadow-[0_4px_0_0_rgba(0,0,0,1)]
    hover:shadow-[0_6px_0_0_rgba(0,0,0,1)]
    active:shadow-none
    active:border-b-2
  `,
  outline: `
    bg-white text-black
    border-2 border-black border-b-4
    shadow-[0_4px_0_0_rgba(0,0,0,1)]
    hover:shadow-[0_6px_0_0_rgba(0,0,0,1)]
    hover:bg-gray-50
    active:shadow-none
    active:border-b-2
  `,
  ghost: `
    bg-transparent text-black
    border-2 border-transparent
    hover:bg-gray-100 hover:border-black
  `,
  icon: `
    bg-black text-white
    rounded-lg
  `
};

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  hasShimmer = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isNeubrutalism = variant !== 'ghost' && variant !== 'icon';
  
  return (
    <motion.button
      className={`
        relative overflow-hidden
        font-bold rounded-lg
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        touch-target touch-feedback
        ${variantStyles[variant]}
        ${className}
      `}
      whileHover={disabled ? undefined : { 
        y: isNeubrutalism ? -2 : 0,
        scale: variant === 'icon' ? 1.05 : 1,
      }}
      whileTap={disabled ? undefined : { 
        y: isNeubrutalism ? 4 : 0,
        scale: variant === 'icon' ? 0.95 : 0.98,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      disabled={disabled}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
      }}
      {...props}
    >
      {/* Shimmer Effect Layer */}
      {hasShimmer && !disabled && (
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['200% center', '-200% center'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'linear',
          }}
        />
      )}
      
      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

export default AnimatedButton;
