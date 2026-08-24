'use client';

import * as React from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarGroup, AvatarGroupTooltip } from '@/components/ui/avatar-group';
import { cn } from '@/lib/utils';
export interface CourseTeacherAssignment {
  id: string;
  teacherId: string;
  courseId: string;
  isMain?: boolean;
  teacher: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

const AVATAR_MOTION_TRANSITION = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
} as const;

const GROUP_CONTAINER_TRANSITION = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
} as const;

interface SelectMainTeacherProps {
  assignments: CourseTeacherAssignment[];
  onSelectMainTeacher?: (assignmentId: string) => void;
  mainTeacherId?: string;
}

function SelectMainTeacher({ assignments, onSelectMainTeacher, mainTeacherId }: SelectMainTeacherProps) {
  const [togglingGroup, setTogglingGroup] = React.useState<'main' | 'secondary' | null>(null);
  const [optimisticAssignments, setOptimisticAssignments] = React.useState(assignments);

  // Mettre à jour les assignations optimistes quand les vraies données changent
  React.useEffect(() => {
    setOptimisticAssignments(assignments);
  }, [assignments]);

  const mainTeachers = optimisticAssignments.filter((assignment) => assignment.isMain === true);
  const secondaryTeachers = optimisticAssignments.filter((assignment) => assignment.isMain !== true);


  console.log("Teachers M S:", mainTeachers, secondaryTeachers);
  const handleTeacherClick = (assignment: CourseTeacherAssignment) => {
    if (!onSelectMainTeacher) return;

    setTogglingGroup(assignment.isMain === true ? 'main' : 'secondary');
    
    // Si le professeur n'est pas déjà le principal, faire la mise à jour optimiste d'abord
    if (assignment.isMain !== true) {
      // Mise à jour optimiste immédiate
      setOptimisticAssignments(prev => 
        prev.map(a => ({
          ...a,
          isMain: a.id === assignment.id
        }))
      );

      // Appeler la fonction de mise à jour backend après un délai pour laisser l'animation se faire
      setTimeout(() => {
        onSelectMainTeacher(assignment.id);
      }, 300); // Délai pour laisser l'animation se terminer
    }

    setTimeout(() => setTogglingGroup(null), 500);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center ml-2 gap-5">
      <LayoutGroup>
        {mainTeachers.length > 0 && (
          <motion.div
            layout
            className={cn(
              'bg-neutral-300 dark:bg-neutral-700 p-0.5 rounded-full',
              togglingGroup === 'main' ? 'z-5' : 'z-10',
            )}
            transition={GROUP_CONTAINER_TRANSITION}
          >
            <AvatarGroup
              key={mainTeachers.map((a) => a.id).join('_') + '-main'}
              translate="0"
              className="h-10 -space-x-2.5"
              tooltipProps={{ side: 'top', sideOffset: 14 }}
            >
              {mainTeachers.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  layoutId={`avatar-${assignment.id}`}
                  className="cursor-pointer"
                  onClick={() => handleTeacherClick(assignment)}
                  animate={{
                    filter: 'grayscale(0)',
                    scale: 1,
                  }}
                  transition={AVATAR_MOTION_TRANSITION}
                  title={`${assignment.teacher.name || 'Nom inconnu'} - Professeur principal`}
                  initial={false}
                >
                  <Avatar className="size-10 border-2 border-blue-100 dark:border-blue-200">
                    <AvatarImage src={assignment.teacher.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(assignment.teacher.name)}</AvatarFallback>
                    <AvatarGroupTooltip>
                     {assignment.teacher.name || 'Nom inconnu'} 
                    </AvatarGroupTooltip>
                  </Avatar>
                </motion.div>
              ))}
            </AvatarGroup>
          </motion.div>
        )}

        {secondaryTeachers.length > 0 && (
          <motion.div
            layout
            className={cn(
              'bg-neutral-300 dark:bg-neutral-700 max-w-40 overflow-x-scroll scrollbar-hidden p-0.5 rounded-full',
              togglingGroup === 'secondary' ? 'z-5' : 'z-10',
            )}
            transition={GROUP_CONTAINER_TRANSITION}
          >
            <AvatarGroup
              key={secondaryTeachers.map((a) => a.id).join('_') + '-secondary'}
              translate="0"
              className="h-10 -space-x-2.5"
              tooltipProps={{ side: 'top', sideOffset: 14 }}
            >
              {secondaryTeachers.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  layoutId={`avatar-${assignment.id}`}
                  className="cursor-pointer"
                  onClick={() => handleTeacherClick(assignment)}
                  animate={{
                    filter: 'grayscale(0.3)',
                    scale: 1,
                  }}
                  transition={AVATAR_MOTION_TRANSITION}
                  title={`Cliquer pour définir ${assignment.teacher.name || 'Nom inconnu'} comme professeur principal`}
                  initial={false}
                >
                  <Avatar className="size-10 border-2 border-neutral-300 dark:border-neutral-700">
                    <AvatarImage src={assignment.teacher.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(assignment.teacher.name)}</AvatarFallback>
                    <AvatarGroupTooltip>
                    {assignment.teacher.name || 'Nom inconnu'}
                    </AvatarGroupTooltip>
                  </Avatar>
                </motion.div>
              ))}
            </AvatarGroup>
          </motion.div>
        )}
      </LayoutGroup>
    </div>
  );
}

export { SelectMainTeacher };
