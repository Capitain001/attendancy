'use client';

import React from 'react';

interface RotatingDashedProps {
  children?: React.ReactNode;
}

export default function RotatingDashed({ children }: RotatingDashedProps) {
  return (
    <div className="relative size-24 mx-auto mt-10 bg-transparent flex items-center justify-center">
      
      {/* Anneau tournant extérieur */}
      <div className="absolute w-[110%] h-[110%] border border-dashed bg-muted rounded-full animate-spin-slow-15 pointer-events-none flex items-center justify-center">
        
        {/* Cercle intérieur imbriqué (plus petit, fixe dans l’anneau) */}
        <div className="w-[80%] h-[80%] border border-dashed  rounded-full" />
      </div>

      {/* Enfant centré */}
      <div className="relative z-10 bg-transparent  rounded-full aspect-square w-[80%] flex items-center justify-center overflow-hidden">
      {children}
      </div>
    </div>
  );
}
