import React, { useRef, useState, useEffect, MouseEvent } from 'react';

interface AtroposCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  intensity?: 'normal' | 'low';
}

const AtroposCard: React.FC<AtroposCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  intensity = 'normal' 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 0, y: 0, opacity: 0 });
  const [scale, setScale] = useState(1);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Configuration based on intensity
  const MAX_ROTATION = intensity === 'low' ? 5 : 15; // Decreased rotation for large cards
  const HOVER_SCALE = intensity === 'low' ? 1.015 : 1.05; // Subtle scale for large cards

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Request gyroscope permission (iOS 13+)
  const requestGyroPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setIsGyroActive(true);
        }
      } catch (error) {
        console.log('Gyroscope permission denied:', error);
      }
    } else {
      // Non-iOS or older iOS versions
      setIsGyroActive(true);
    }
  };

  // Handle device orientation for mobile gyroscope effect
  useEffect(() => {
    if (!isMobile || !isGyroActive) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;

      // Beta: front-to-back tilt (-180 to 180)
      // Gamma: left-to-right tilt (-90 to 90)
      
      // Normalize and clamp values
      let beta = event.beta; // -180 to 180
      let gamma = event.gamma; // -90 to 90

      // Convert to rotation values (-MAX_ROTATION to MAX_ROTATION)
      // When device tilts forward (beta positive), card tilts back (rotateX negative)
      const rotateX = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, (beta / 90) * -MAX_ROTATION));
      // When device tilts right (gamma positive), card tilts right (rotateY positive)
      const rotateY = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, (gamma / 90) * MAX_ROTATION));

      setRotation({ x: rotateX, y: rotateY });
      
      // Create shine effect based on tilt
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Map rotation to shine position
        const shineX = centerX + (rotateY / MAX_ROTATION) * centerX;
        const shineY = centerY + (rotateX / MAX_ROTATION) * centerY;
        
        setShine({ x: shineX, y: shineY, opacity: 0.6 });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isMobile, isGyroActive, MAX_ROTATION]);

  // Enable gyroscope on touch for mobile devices
  const handleTouchStart = () => {
    if (isMobile && !isGyroActive) {
      requestGyroPermission();
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    // Disable mouse effects on mobile when gyroscope is active
    if (isMobile && isGyroActive) return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const y = e.clientY - rect.top;  // y position within the element.

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation based on cursor position relative to center
    const rotateX = ((y - centerY) / centerY) * -MAX_ROTATION;
    const rotateY = ((x - centerX) / centerX) * MAX_ROTATION;

    setRotation({ x: rotateX, y: rotateY });
    
    // Shine effect calculation
    setShine({ x, y, opacity: 1 });
  };

  const handleMouseEnter = () => {
    // Disable mouse effects on mobile when gyroscope is active
    if (isMobile && isGyroActive) return;
    setScale(HOVER_SCALE);
  };

  const handleMouseLeave = () => {
    // Disable mouse effects on mobile when gyroscope is active
    if (isMobile && isGyroActive) return;
    setRotation({ x: 0, y: 0 });
    setShine({ ...shine, opacity: 0 });
    setScale(1);
  };

  return (
    <div
      className={`perspective-1000 relative select-none cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onClick={onClick}
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        className="relative w-full h-full transition-transform duration-100 ease-out transform-gpu bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${scale}, ${scale}, ${scale})`,
        }}
      >
        {/* Shine Layer */}
        <div
          className="absolute z-10 pointer-events-none mix-blend-overlay transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${shine.x}px ${shine.y}px, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`,
            width: '100%',
            height: '100%',
            opacity: shine.opacity,
          }}
        />
        
        {/* Content Layer */}
        <div className="relative z-0 h-full flex flex-col">
          {children}
        </div>

        {/* Gyroscope indicator for mobile (shown only when gyro is not active) */}
        {isMobile && !isGyroActive && (
          <div className="absolute top-2 right-2 z-20 bg-black/70 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
            点击启用陀螺仪
          </div>
        )}
      </div>
    </div>
  );
};

export default AtroposCard;