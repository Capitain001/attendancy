'use client';
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface TransitionProps {
  contents: React.ReactNode[];
  transitionDelay?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  onTransitionComplete?: (currentIndex: number) => void;
}

export default function Transition({ 
  contents, 
  transitionDelay = 3500, 
  autoPlay = true,
  showControls = false,
  onTransitionComplete 
}: TransitionProps) {
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialiser les refs
  useEffect(() => {
    contentRefs.current = contentRefs.current.slice(0, contents.length);
  }, [contents.length]);

  // Animation d'entrée pour le premier élément
  useEffect(() => {
    if (contents.length === 0) return;

    const currentRef = contentRefs.current[0];
    if (currentRef) {
      gsap.fromTo(
        currentRef,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }
      );

      // Programmer la transition automatique si autoPlay est activé
      if (autoPlay && contents.length > 1) {
        const timer = setTimeout(() => {
          goToNext();
        }, transitionDelay);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const goToNext = () => {
    if (currentIndex >= contents.length - 1) return;

    const currentRef = contentRefs.current[currentIndex];
    const nextIndex = currentIndex + 1;

    if (currentRef) {
      gsap.to(currentRef, {
        y: -60,
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentIndex(nextIndex);
          onTransitionComplete?.(nextIndex);
        },
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex <= 0) return;

    const currentRef = contentRefs.current[currentIndex];
    const prevIndex = currentIndex - 1;

    if (currentRef) {
      gsap.to(currentRef, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentIndex(prevIndex);
          onTransitionComplete?.(prevIndex);
        },
      });
    }
  };

  const goToIndex = (index: number) => {
    if (index < 0 || index >= contents.length || index === currentIndex) return;

    const currentRef = contentRefs.current[currentIndex];
    
    if (currentRef) {
      const direction = index > currentIndex ? -60 : 60;
      
      gsap.to(currentRef, {
        y: direction,
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentIndex(index);
          onTransitionComplete?.(index);
        },
      });
    }
  };

  // Animation d'entrée pour le nouvel élément
  useEffect(() => {
    const currentRef = contentRefs.current[currentIndex];
    if (currentRef) {
      gsap.fromTo(
        currentRef,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }
      );

      // Programmer la transition automatique suivante si autoPlay est activé
      if (autoPlay && currentIndex < contents.length - 1) {
        const timer = setTimeout(() => {
          goToNext();
        }, transitionDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex]);

  if (contents.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Conteneur principal avec hauteur fixe pour éviter les sauts */}
      <div className="relative h-64 flex items-center justify-center">
        {contents.map((content, index) => (
          <div
            key={index}
            ref={el => { contentRefs.current[index] = el; }}
            className={`absolute w-full flex justify-center ${
              index === currentIndex ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            style={{
              visibility: index === currentIndex ? 'visible' : 'hidden',
            }}
          >
            {content}
          </div>
        ))}
      </div>

      {/* Contrôles de navigation (optionnel) */}
      {showControls && contents.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          
          {/* Indicateurs de progression */}
          <div className="flex space-x-2 items-center">
            {contents.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentIndex === contents.length - 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
