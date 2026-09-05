"use client";

import type React from "react";
import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Iphone15ProProps extends React.SVGProps<SVGSVGElement> {
  width?: string | number;
  height?: string | number;
  src?: string;
  alt?: string;
}

const Iphone15Pro: React.FC<Iphone15ProProps> = ({
  width = "100%",
  height = "auto",
  src,
  alt = "iPhone screen content",
  className,
  ...props
}) => {
  const clipId = useId();

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 433 882"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform duration-300 ease-out", className)}
      {...props}
    >
      <path
        d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
        className="fill-[#2b2b2b]"
      />
      <path
        d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
        className="fill-[#1a1a1a]"
      />
      {src && (
        <foreignObject
          x="21.25"
          y="19.25"
          width="389.5"
          height="843.5"
          clipPath={`url(#${clipId})`}
        >
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Image
              src={src}
              alt={alt}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 70vw, 280px"
            />
          </div>
        </foreignObject>
      )}
      <path
        d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
        className="fill-[#1a1a1a]"
      />
      <path
        d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
        className="fill-[#1a1a1a]"
      />
      <defs>
        <clipPath id={clipId}>
          <rect
            x="21.25"
            y="19.25"
            width="389.5"
            height="843.5"
            rx="55.75"
            ry="55.75"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export interface ImageItem {
  src: string;
  alt: string;
}

interface PhoneCarouselProps {
  images: ImageItem[];
  className?: string;
}

export const PhoneCarousel: React.FC<PhoneCarouselProps> = ({
  images,
  className,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const phoneWidth = isMobile ? 175 : 235;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isPaused || isHovering || images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isClient, isPaused, isHovering, images.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (!isClient) return null;

  return (
    <div className={cn("relative w-full", className)} aria-label="App preview">
      <div
        className="relative flex items-center justify-center overflow-visible py-2"
        style={{ minHeight: phoneWidth * 2.05 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredIndex(null);
        }}
      >
        {images.map((image, index) => {
          const isActive = index === currentIndex;
          const isPrevious =
            index === currentIndex - 1 ||
            (currentIndex === 0 && index === images.length - 1);
          const isNext =
            index === currentIndex + 1 ||
            (currentIndex === images.length - 1 && index === 0);
          const isHovered = hoveredIndex === index;
          const isVisible = isActive || isPrevious || isNext;

          // Elevate hovered phone to highest z-index
          const zIndex = isHovered ? 50 : isActive ? 20 : isPrevious || isNext ? 10 : 0;

          return (
            <div
              key={`${image.src}-${index}`}
              style={{ zIndex }}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "absolute transition-all duration-500 cubic-bezier(0.34,1.56,0.64,1) will-change-transform cursor-pointer pointer-events-auto select-none rounded-[40px]",
                isActive && "translate-x-0 scale-100 opacity-100 shadow-xl",
                isPrevious && "-translate-x-[58%] sm:-translate-x-[62%] scale-[0.88] opacity-75 hover:opacity-100",
                isNext && "translate-x-[58%] sm:translate-x-[62%] scale-[0.88] opacity-75 hover:opacity-100",
                isHovered && "!scale-[1.08] !opacity-100 -translate-y-3 shadow-2xl ring-4 ring-saffron-400/40 rounded-[44px]",
                !isVisible && "pointer-events-none scale-85 opacity-0"
              )}
            >
              <Iphone15Pro
                width={phoneWidth}
                height="auto"
                src={image.src}
                alt={image.alt}
                className={cn("drop-shadow-lg", isHovered && "drop-shadow-2xl")}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          className="h-9 w-9 rounded-full border-saffron-200 bg-white/80 shadow-sm hover:bg-saffron-50"
          aria-label="Previous screen"
        >
          <ChevronLeft className="h-4 w-4 text-saffron-700" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaused((p) => !p)}
          className="h-9 w-9 rounded-full border-saffron-200 bg-white/80 shadow-sm hover:bg-saffron-50"
          aria-label={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? (
            <Play className="h-4 w-4 text-saffron-700" />
          ) : (
            <Pause className="h-4 w-4 text-saffron-700" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="h-9 w-9 rounded-full border-saffron-200 bg-white/80 shadow-sm hover:bg-saffron-50"
          aria-label="Next screen"
        >
          <ChevronRight className="h-4 w-4 text-saffron-700" />
        </Button>
      </div>
    </div>
  );
};
