'use client';
import React, { useRef, useEffect, useState } from 'react';

import { gsap } from 'gsap';

interface ContentItem {
  content: React.ReactNode;
  duration?: number; // Durée d'affichage en ms (optionnel)
}

interface TransitionProps {
  contents: ContentItem[];
  transitionDuration?: number; // Durée de transition en ms (défaut: 1000)
  delay?: number; // Délai initial en ms (défaut: 0)
  showNavigation?: boolean; // Afficher les contrôles de navigation (défaut: true)
}

export default function Transition({ 
  contents, 
  transitionDuration = 1000, 
  delay = 0,
  showNavigation = false
}: TransitionProps) {
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialiser les refs pour chaque contenu
  useEffect(() => {
    contentRefs.current = contentRefs.current.slice(0, contents.length);
  }, [contents.length]);

  // Animation d'entrée du premier contenu
  useEffect(() => {
    if (contents.length === 0) return;

    const timer = setTimeout(() => {
      if (contentRefs.current[0]) {
        gsap.fromTo(
          contentRefs.current[0],
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: transitionDuration / 1000, ease: 'power2.out' }
        );
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [contents.length, transitionDuration, delay]);

  // Gestion des transitions automatiques
  useEffect(() => {
    if (contents.length <= 1) return;

    const currentContent = contents[currentIndex];
    const duration = currentContent.duration || 3500; // Durée par défaut

    const timer = setTimeout(() => {
      if (currentIndex < contents.length - 1) {
        transitionToNext();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, contents]);

  const transitionToNext = () => {
    if (isTransitioning || currentIndex >= contents.length - 1) return;

    setIsTransitioning(true);
    const currentRef = contentRefs.current[currentIndex];
    const nextIndex = currentIndex + 1;
    const nextRef = contentRefs.current[nextIndex];

    if (currentRef) {
      // Animation de sortie du contenu actuel
      gsap.to(currentRef, {
        y: -60,
        opacity: 0,
        duration: transitionDuration / 1000,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentIndex(nextIndex);
          setIsTransitioning(false);
        }
      });
    }

    // Animation d'entrée du contenu suivant
    if (nextRef) {
      gsap.fromTo(
        nextRef,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: transitionDuration / 1000, ease: 'power2.out' }
      );
    }
  };

  // Fonction pour passer manuellement au contenu suivant
  const goToNext = () => {
    if (currentIndex < contents.length - 1) {
      transitionToNext();
    }
  };

  // Fonction pour passer au contenu précédent
  const goToPrevious = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const currentRef = contentRefs.current[currentIndex];
      const prevIndex = currentIndex - 1;
      const prevRef = contentRefs.current[prevIndex];

      if (currentRef) {
        gsap.to(currentRef, {
          y: 60,
          opacity: 0,
          duration: transitionDuration / 1000,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentIndex(prevIndex);
            setIsTransitioning(false);
          }
        });
      }

      if (prevRef) {
        gsap.fromTo(
          prevRef,
          { y: -60, opacity: 0 },
          { y: 0, opacity: 1, duration: transitionDuration / 1000, ease: 'power2.out' }
        );
      }
    }
  };

  // Fonction pour aller à un contenu spécifique
  const goToIndex = (index: number) => {
    if (index >= 0 && index < contents.length && index !== currentIndex && !isTransitioning) {
      setIsTransitioning(true);
      const currentRef = contentRefs.current[currentIndex];
      const targetRef = contentRefs.current[index];

      if (currentRef) {
        gsap.to(currentRef, {
          y: index > currentIndex ? -60 : 60,
          opacity: 0,
          duration: transitionDuration / 1000,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentIndex(index);
            setIsTransitioning(false);
          }
        });
      }

      if (targetRef) {
        gsap.fromTo(
          targetRef,
          { y: index > currentIndex ? 60 : -60, opacity: 0 },
          { y: 0, opacity: 1, duration: transitionDuration / 1000, ease: 'power2.out' }
        );
      }
    }
  };

  if (contents.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      {contents.map((item, index) => (
        <div
          key={index}
          ref={(el) => {
            contentRefs.current[index] = el;
          }}
          className={`w-full flex justify-center ${
            index === currentIndex ? 'block' : 'hidden'
          }`}
        >
          {item.content}
        </div>
      ))}
      
      {/* Contrôles optionnels pour navigation manuelle */}
      {showNavigation && contents.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0 || isTransitioning}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === contents.length - 1 || isTransitioning}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
} 