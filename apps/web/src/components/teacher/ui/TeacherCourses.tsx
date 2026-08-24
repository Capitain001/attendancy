"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface Course {
  id: string;
  name: string;
}

interface TeacherCoursesProps {
  courses: Course[];
  loading?: boolean;
}

export function TeacherCourses({ courses = [], loading = false }: TeacherCoursesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cours enseignés</CardTitle>
          <CardDescription>Liste des matières enseignées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cours enseignés</CardTitle>
          <CardDescription>Liste des matières enseignées</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <EmptyTitle>Aucun cours</EmptyTitle>
              <EmptyDescription>
                Aucun cours assigné à cet enseignant pour le moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cours enseignés</CardTitle>
        <CardDescription>{courses.length} matière{courses.length > 1 ? "s" : ""} enseignée{courses.length > 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium border border-primary/20"
            >
              {course.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

