CREATE UNIQUE INDEX one_main_teacher_per_course 
ON "CourseTeacher"("courseId") 
WHERE "isMain" = true;
