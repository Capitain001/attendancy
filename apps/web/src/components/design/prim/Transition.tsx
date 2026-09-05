'use client';
import React, { useRef, useEffect, useState } from 'react';

import { gsap } from 'gsap';

interface TransitionProps {
  content1: React.ReactNode;
  content2: React.ReactNode;
}

export default function Transition({content1, content2}: TransitionProps) {
  const content1Ref = useRef<HTMLDivElement>(null);
  const content2Ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (content1Ref.current) {
      gsap.fromTo(
        content1Ref.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }
      );
      // Après 2.5s, fait disparaître WelcomeAnimation et fait apparaître le formulaire
      setTimeout(() => {
        gsap.to(content1Ref.current, {
          y: -60,
          opacity: 0,
          duration: 1,
          ease: 'power2.in',
          onComplete: () => setShow(true),
        });
      }, 3500);
    }
  }, []);

  useEffect(() => {
    if (show && content2Ref.current) {
      gsap.fromTo(
        content2Ref.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }
      );
    }
  }, [show]);

  return (
    <>
      {!show && (
        <div ref={content1Ref} className="w-full flex justify-center">
          {content1}
        </div>
      )}
      {show && (
        <div ref={content2Ref} className="w-full flex justify-center">
          {content2}
        </div>
      )}
    </>
  );
} 
