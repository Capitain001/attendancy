import { Suspense } from 'react'
import { CollapseSection } from './ui/CollapseSection'
import {
  CourseBannerSection,
  CourseMetricsSection,
  CourseInfoAndStatsSection,
  CourseUpcomingSection,
  CourseHistorySection,
  CourseTeachersIsland,
  EvaluationsSection,
  BannerSkeleton,
  MetricsSkeleton,
  BlockSkeleton,
} from './sections'

interface DirectionCourseDetailPageProps {
  courseId: string
  slug: string
}

export async function DirectionCourseDetailPage({ courseId }: DirectionCourseDetailPageProps) {
  return (
    <div className="space-y-4 px-4 pb-8 pt-4 w-full mx-auto">
      <Suspense fallback={<BannerSkeleton />}>
        <CourseBannerSection courseId={courseId} />
      </Suspense>

      <Suspense fallback={<MetricsSkeleton />}>
        <CourseMetricsSection courseId={courseId} />
      </Suspense>

      <CollapseSection label="Détails" defaultOpen>
        <Suspense fallback={<BlockSkeleton className="min-h-50" />}>
          <CourseInfoAndStatsSection courseId={courseId} />
        </Suspense>
      </CollapseSection>

      <CollapseSection label="Progression" defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CourseTeachersIsland courseId={courseId} />
          <Suspense fallback={<BlockSkeleton className="min-h-50" />}>
            <CourseUpcomingSection courseId={courseId} />
          </Suspense>
        </div>
      </CollapseSection>

      <CollapseSection label="Évaluations">
        <EvaluationsSection />
      </CollapseSection>

      <CollapseSection label="Historique">
        <Suspense fallback={<BlockSkeleton className="min-h-[120px]" />}>
          <CourseHistorySection courseId={courseId} />
        </Suspense>
      </CollapseSection>
    </div>
  )
}
