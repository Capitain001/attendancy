"use client"
import { cn } from '@/lib/utils';
import React from 'react';

interface HoverEffectProps {
    children: React.ReactNode;
    initialBg?: string;
    hoverBg?: string;
    textColor?: string;
    coverTextSize?: string;
    className?: string;
}

const HoverEffect = ({ 
  children, 
  initialBg = 'bg-gray-800', 
  hoverBg = 'bg-red-600',
  textColor = '',
  coverTextSize = 'text-4xl',
  className = '',
}: HoverEffectProps) => {
  return (
    <div 
      className={cn(
        "relative w-full h-full flex items-center justify-center flex-col cursor-pointer rounded-xl",
        initialBg, 
        textColor, 
        className
      )}
      style={{ perspective: '500px' }} // CSS pur pour la perspective
    >
      {/* Content */}
      <div className="content p-5 w-full h-full flex items-center justify-center">
        {children}
      </div>
      
      {/* Cover with hover effect */}
      <div 
        className={cn(
          "cover absolute inset-0 flex items-center justify-center font-fredoka rounded-xl",
          "transition-transform duration-1000 ease-in-out",
          hoverBg, 
          textColor, 
          coverTextSize
        )}
        style={{ 
          transformOrigin: 'left top',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>

      {/* Style CSS pour l'effet hover */}
      <style jsx>{`
        .cover {
          backface-visibility: hidden;
        }
        div:hover .cover {
          transform: rotateY(-100deg);
        }
      `}</style>
    </div>
  );
};

export default HoverEffect;
