import { CoursePage } from '@/components/teacher/courses/CoursePage'
import { mockCourse } from '@/data/mocks/mock.course-teacher'



export default function Page() {
  return <CoursePage course={mockCourse} />
}