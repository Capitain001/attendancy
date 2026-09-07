"use client";

import { useState, useMemo } from "react";
import type { GetEnrolledStudentsDto } from "@/services/student";

export function useStudentsFilter(students?: GetEnrolledStudentsDto | null) {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter((e) => {
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const firstName = e.student.user.firstName?.toLowerCase() || "";
        const lastName = e.student.user.lastName?.toLowerCase() || "";
        const email = e.student.user.email.toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const matchesQuery =
          firstName.includes(q) ||
          lastName.includes(q) ||
          fullName.includes(q) ||
          email.includes(q);
        if (!matchesQuery) return false;
      }

      if (groupId) {
        const isInGroup = e.studentGroups.some((sg) => sg.group.id === groupId);
        if (!isInGroup) return false;
      }

      return true;
    });
  }, [students, query, groupId]);

  const hasActiveFilters = Boolean(query || groupId);

  const clearFilters = () => {
    setQuery("");
    setGroupId("");
  };

  return {
    query,
    setQuery,
    groupId,
    setGroupId,
    filteredStudents,
    hasActiveFilters,
    clearFilters,
  };
}
