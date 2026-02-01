import React, { useRef, useState, MouseEvent } from 'react';

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

  // Configuration based on intensity
  const MAX_ROTATION = intensity === 'low' ? 5 : 15; // Decreased rotation for large cards
  const HOVER_SCALE = intensity === 'low' ? 1.015 : 1.05; // Subtle scale for large cards

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
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
    setScale(HOVER_SCALE);
  };

  const handleMouseLeave = () => {
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
      </div>
    </div>
  );
};

export default AtroposCard;