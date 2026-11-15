
import { ChevronUp } from "lucide-react";

import { SwipeNavigator } from "@/components/swipe-navigator";
import { TeacherDailyOverviewScreen } from "@/components/personal/teacher/screen/TeacherDailyOverviewScreen";
import TeacherDailyScheduleListScreen from "@/components/personal/teacher/screen/TeacherDailyScheduleListScreen";
import { ScrollNavigator } from '../../../../../../../packages/ui/src/components/navigation/scroll-navigator';

export default function TeacherDailyScreen({ sessionsHref }: { sessionsHref?: string } = {}) {
  return (
    <ScrollNavigator
      panels={[
        <TeacherDailyOverviewScreen key="overview"  />,
        <TeacherDailyScheduleListScreen key="list" />,
      ]}
    />
  )
}





// // src/components/personal/teacher/screen/TeacherDailyScreen.tsx
// "use client";


// export default function TeacherDailyScreen({ sessionsHref }: { sessionsHref?: string } = {}) {
//   const [screen, setScreen] = useState(0);

//   return (
//         // <TeacherDailyOverviewScreen key="overview" sessionsHref={sessionsHref} />
//           <TeacherDailyScheduleListScreen key="list" />
//     // <section className="relative h-[calc(100vh-1rem)] w-full snap-y snap-mandatory overflow-y-scroll bg-[#f5f4f3] dark:bg-background">
//     //   <div className="snap-start">
//     //     <TeacherDailyOverviewScreen key="overview" sessionsHref={sessionsHref} />

//     //   </div>
//     //   <div className="snap-start">
//     //     <TeacherDailyScheduleListScreen key="list" />
//     //   </div>

//     // </section>
//     // <SwipeNavigator
//     //   value={screen}
//     //   onValueChange={setScreen}
//     //   panels={[
//     //     <TeacherDailyOverviewScreen key="overview" sessionsHref={sessionsHref} />,
//     //       <TeacherDailyScheduleListScreen key="list" />,
//     //   ]}
//     //   hint={
//     //     <>
//     //       <ChevronUp className="size-4 animate-bounce" />
//     //       <span className="text-xs">Glisser pour la liste des cours</span>
//     //     </>
//     //   }
//     // />
//   );
// }