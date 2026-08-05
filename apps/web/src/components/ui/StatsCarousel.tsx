'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselIndicator,
  CarouselNavigation,
} from '@/components/ui/carouselx'
import { cn } from '@/lib/utils'

type StatItem = {
  title: string
  content: React.ReactNode
}

type StatsCarouselProps = {
  items: StatItem[]
  className?: string
  showNavigation?: boolean
  showIndicator?: boolean
}

export function StatsCarousel({
  items,
  className,
  showNavigation = false,
  showIndicator = true,
}: StatsCarouselProps) {
  return (
    <div className={cn('w-full', className)}>
      <Carousel className="w-full">
        <CarouselContent className="w-full">
          {items.map((item, index) => (
            <CarouselItem key={index} className="w-full">
              <div className="flex flex-col items-center justify-center min-h-80 px-4 py-4 sm:px-8">
                {/* Title */}
                <div className=" text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground animate-fade-in">
                    {item.title}
                  </h3>
                  <div className="mt-2 h-1 w-12 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
                </div>

                {/* Content */}
                <div className="w-full  flex-1 flex items-center justify-center animate-fade-in">
                  {item.content}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {showNavigation && <CarouselNavigation alwaysShow />}
        {showIndicator && <CarouselIndicator />}
      </Carousel>
    </div>
  )
}