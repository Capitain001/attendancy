import { GetTeachersDto } from "@/services/teacher";

export const mockgetTeachers:GetTeachersDto = [
  {
    id: "teacher-001",
    _count: {
      courses: 4,
    },
    departmentId: "department-001",
    department: {
      id: "department-001",
      name: "Informatique",
    },
    user: {
      id: "user-001",
      email: "jean.dupont@example.com",
      avatar_url: null,
      status: "ACTIVE",
      firstName: "Jean",
      lastName: "Dupont",
    },
  },
  {
    id: "teacher-002",
    _count: {
      courses: 2,
    },
    departmentId: "department-001",
    department: {
      id: "department-001",
      name: "Informatique",
    },
    user: {
      id: "user-002",
      email: "marie.koffi@example.com",
      avatar_url: null,
      status: "ACTIVE",
      firstName: "Marie",
      lastName: "Koffi",
    },
  },
  {
    id: "teacher-003",
    _count: {
      courses: 6,
    },
    departmentId: "department-002",
    department: {
      id: "department-002",
      name: "Mathématiques",
    },
    user: {
      id: "user-003",
      email: "paul.ayivi@example.com",
      avatar_url: null,
      status: "ACTIVE",
      firstName: "Paul",
      lastName: "Ayivi",
    },
  },
  {
    id: "teacher-004",
    _count: {
      courses: 0,
    },
    departmentId: null,
    department: null,
    user: {
      id: "user-004",
      email: "sarah.mensah@example.com",
      avatar_url: null,
      status: "INACTIVE",
      firstName: "Sarah",
      lastName: "Mensah",
    },
  },
]