export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AcademicYear: {
        Row: {
          endDate: string
          id: string
          isActive: boolean
          isCurrent: boolean
          name: string
          orgId: string
          startDate: string
        }
        Insert: {
          endDate: string
          id?: string
          isActive?: boolean
          isCurrent?: boolean
          name: string
          orgId: string
          startDate: string
        }
        Update: {
          endDate?: string
          id?: string
          isActive?: boolean
          isCurrent?: boolean
          name?: string
          orgId?: string
          startDate?: string
        }
        Relationships: [
          {
            foreignKeyName: "AcademicYear_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Admin: {
        Row: {
          createdAt: string
          deletedAt: string | null
          id: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Admin_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ApprovalRequest: {
        Row: {
          appliedAt: string | null
          changes: Json
          createdAt: string
          id: string
          kind: string
          orgId: string
          reason: string | null
          requestedById: string
          resourceId: string
          resourceType: Database["public"]["Enums"]["Resource"]
          reviewedAt: string | null
          reviewedById: string | null
          reviewNote: string | null
          status: Database["public"]["Enums"]["ApprovalStatus"]
          updatedAt: string
        }
        Insert: {
          appliedAt?: string | null
          changes: Json
          createdAt?: string
          id?: string
          kind: string
          orgId: string
          reason?: string | null
          requestedById: string
          resourceId: string
          resourceType: Database["public"]["Enums"]["Resource"]
          reviewedAt?: string | null
          reviewedById?: string | null
          reviewNote?: string | null
          status?: Database["public"]["Enums"]["ApprovalStatus"]
          updatedAt: string
        }
        Update: {
          appliedAt?: string | null
          changes?: Json
          createdAt?: string
          id?: string
          kind?: string
          orgId?: string
          reason?: string | null
          requestedById?: string
          resourceId?: string
          resourceType?: Database["public"]["Enums"]["Resource"]
          reviewedAt?: string | null
          reviewedById?: string | null
          reviewNote?: string | null
          status?: Database["public"]["Enums"]["ApprovalStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ApprovalRequest_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ApprovalRequest_requestedById_fkey"
            columns: ["requestedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ApprovalRequest_reviewedById_fkey"
            columns: ["reviewedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Attendance: {
        Row: {
          details: Json | null
          enrollmentId: string
          id: string
          notes: string | null
          orgId: string
          recordedAt: string
          scheduleId: string
          status: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
        }
        Insert: {
          details?: Json | null
          enrollmentId: string
          id?: string
          notes?: string | null
          orgId: string
          recordedAt?: string
          scheduleId: string
          status?: Database["public"]["Enums"]["AttendanceStatus"]
          studentId: string
        }
        Update: {
          details?: Json | null
          enrollmentId?: string
          id?: string
          notes?: string | null
          orgId?: string
          recordedAt?: string
          scheduleId?: string
          status?: Database["public"]["Enums"]["AttendanceStatus"]
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Attendance_enrollmentId_fkey"
            columns: ["enrollmentId"]
            isOneToOne: false
            referencedRelation: "StudentEnrollment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Attendance_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Attendance_scheduleId_fkey"
            columns: ["scheduleId"]
            isOneToOne: false
            referencedRelation: "Schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Attendance_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      AuditLog: {
        Row: {
          action: Database["public"]["Enums"]["Action"]
          createdAt: string
          details: Json | null
          id: string
          ipAddress: string | null
          orgId: string | null
          resource: string | null
          resourceId: string | null
          userAgent: string | null
          userId: string
        }
        Insert: {
          action: Database["public"]["Enums"]["Action"]
          createdAt?: string
          details?: Json | null
          id?: string
          ipAddress?: string | null
          orgId?: string | null
          resource?: string | null
          resourceId?: string | null
          userAgent?: string | null
          userId: string
        }
        Update: {
          action?: Database["public"]["Enums"]["Action"]
          createdAt?: string
          details?: Json | null
          id?: string
          ipAddress?: string | null
          orgId?: string | null
          resource?: string | null
          resourceId?: string | null
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AuditLog_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AuditLog_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Channel: {
        Row: {
          classId: string | null
          createdAt: string
          deletedAt: string | null
          groupId: string | null
          id: string
          isPrivate: boolean
          name: string | null
          orgId: string
          type: Database["public"]["Enums"]["ChannelType"]
        }
        Insert: {
          classId?: string | null
          createdAt?: string
          deletedAt?: string | null
          groupId?: string | null
          id?: string
          isPrivate?: boolean
          name?: string | null
          orgId: string
          type: Database["public"]["Enums"]["ChannelType"]
        }
        Update: {
          classId?: string | null
          createdAt?: string
          deletedAt?: string | null
          groupId?: string | null
          id?: string
          isPrivate?: boolean
          name?: string | null
          orgId?: string
          type?: Database["public"]["Enums"]["ChannelType"]
        }
        Relationships: [
          {
            foreignKeyName: "Channel_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Channel_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Channel_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      ChannelMember: {
        Row: {
          channelId: string
          id: string
          joinedAt: string
          lastReadAt: string | null
          role: Database["public"]["Enums"]["ParticipantRole"]
          userId: string
        }
        Insert: {
          channelId: string
          id?: string
          joinedAt?: string
          lastReadAt?: string | null
          role?: Database["public"]["Enums"]["ParticipantRole"]
          userId: string
        }
        Update: {
          channelId?: string
          id?: string
          joinedAt?: string
          lastReadAt?: string | null
          role?: Database["public"]["Enums"]["ParticipantRole"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ChannelMember_channelId_fkey"
            columns: ["channelId"]
            isOneToOne: false
            referencedRelation: "Channel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ChannelMember_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Class: {
        Row: {
          academicYearId: string
          createdAt: string
          deletedAt: string | null
          id: string
          level: Database["public"]["Enums"]["Level"]
          name: string
          programId: string | null
          programTrackId: string
          updatedAt: string
        }
        Insert: {
          academicYearId: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          level?: Database["public"]["Enums"]["Level"]
          name: string
          programId?: string | null
          programTrackId: string
          updatedAt: string
        }
        Update: {
          academicYearId?: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          level?: Database["public"]["Enums"]["Level"]
          name?: string
          programId?: string | null
          programTrackId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Class_academicYearId_fkey"
            columns: ["academicYearId"]
            isOneToOne: false
            referencedRelation: "AcademicYear"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Class_programId_fkey"
            columns: ["programId"]
            isOneToOne: false
            referencedRelation: "Program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Class_programTrackId_fkey"
            columns: ["programTrackId"]
            isOneToOne: false
            referencedRelation: "ProgramTrack"
            referencedColumns: ["id"]
          },
        ]
      }
      Comment: {
        Row: {
          content: string
          createdAt: string
          deletedAt: string | null
          deletedBy: string | null
          id: string
          orgId: string
          parentId: string | null
          resource: Database["public"]["Enums"]["Resource"]
          targetId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          content: string
          createdAt?: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: string
          orgId: string
          parentId?: string | null
          resource: Database["public"]["Enums"]["Resource"]
          targetId: string
          updatedAt: string
          userId: string
        }
        Update: {
          content?: string
          createdAt?: string
          deletedAt?: string | null
          deletedBy?: string | null
          id?: string
          orgId?: string
          parentId?: string | null
          resource?: Database["public"]["Enums"]["Resource"]
          targetId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Comment_deletedBy_fkey"
            columns: ["deletedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Comment_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Comment_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "Comment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Comment_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Course: {
        Row: {
          classId: string
          createdAt: string
          credits: number
          deletedAt: string | null
          description: string | null
          durationDone: number
          durationTotal: number
          id: string
          name: string
          orgId: string
          settings: Json | null
          termId: string | null
          ueCourseId: string
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          credits: number
          deletedAt?: string | null
          description?: string | null
          durationDone?: number
          durationTotal?: number
          id?: string
          name: string
          orgId: string
          settings?: Json | null
          termId?: string | null
          ueCourseId: string
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          credits?: number
          deletedAt?: string | null
          description?: string | null
          durationDone?: number
          durationTotal?: number
          id?: string
          name?: string
          orgId?: string
          settings?: Json | null
          termId?: string | null
          ueCourseId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Course_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Course_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Course_termId_fkey"
            columns: ["termId"]
            isOneToOne: false
            referencedRelation: "Term"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Course_ueCourseId_fkey"
            columns: ["ueCourseId"]
            isOneToOne: false
            referencedRelation: "UECourse"
            referencedColumns: ["id"]
          },
        ]
      }
      CourseTeacher: {
        Row: {
          courseId: string
          createdAt: string
          hours: number | null
          id: string
          isMain: boolean
          teacherId: string
          updatedAt: string
        }
        Insert: {
          courseId: string
          createdAt?: string
          hours?: number | null
          id?: string
          isMain?: boolean
          teacherId: string
          updatedAt: string
        }
        Update: {
          courseId?: string
          createdAt?: string
          hours?: number | null
          id?: string
          isMain?: boolean
          teacherId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "CourseTeacher_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "Course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CourseTeacher_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      Department: {
        Row: {
          id: string
          name: string
          orgId: string
        }
        Insert: {
          id?: string
          name: string
          orgId: string
        }
        Update: {
          id?: string
          name?: string
          orgId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Department_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Direction: {
        Row: {
          createdAt: string
          deletedAt: string | null
          id: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          orgId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Direction_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Document: {
        Row: {
          createdAt: string
          deletedAt: string | null
          id: string
          name: string
          orgId: string
          path: string
          resourceId: string
          resourceType: Database["public"]["Enums"]["Resource"]
          type: Database["public"]["Enums"]["DocumentType"]
          uploadedById: string | null
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          name: string
          orgId: string
          path: string
          resourceId: string
          resourceType: Database["public"]["Enums"]["Resource"]
          type?: Database["public"]["Enums"]["DocumentType"]
          uploadedById?: string | null
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          name?: string
          orgId?: string
          path?: string
          resourceId?: string
          resourceType?: Database["public"]["Enums"]["Resource"]
          type?: Database["public"]["Enums"]["DocumentType"]
          uploadedById?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Document_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Document_uploadedById_fkey"
            columns: ["uploadedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Evaluation: {
        Row: {
          classId: string
          comment: string | null
          courseId: string
          createdAt: string
          datedAt: string
          id: string
          maxScore: number
          orgId: string
          score: number
          studentId: string
          type: Database["public"]["Enums"]["EvaluationType"]
        }
        Insert: {
          classId: string
          comment?: string | null
          courseId: string
          createdAt?: string
          datedAt?: string
          id?: string
          maxScore?: number
          orgId: string
          score: number
          studentId: string
          type: Database["public"]["Enums"]["EvaluationType"]
        }
        Update: {
          classId?: string
          comment?: string | null
          courseId?: string
          createdAt?: string
          datedAt?: string
          id?: string
          maxScore?: number
          orgId?: string
          score?: number
          studentId?: string
          type?: Database["public"]["Enums"]["EvaluationType"]
        }
        Relationships: [
          {
            foreignKeyName: "Evaluation_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Evaluation_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "Course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Evaluation_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Evaluation_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Event: {
        Row: {
          color: string | null
          createdAt: string
          createdById: string
          deletedAt: string | null
          description: string | null
          endTime: string | null
          id: string
          isPublic: boolean
          isRecurring: boolean
          location: string | null
          orgId: string
          startTime: string | null
          status: Database["public"]["Enums"]["EventStatus"]
          targetRoles: Database["public"]["Enums"]["Role"][] | null
          title: string
          type: Database["public"]["Enums"]["EventType"]
          updatedAt: string
        }
        Insert: {
          color?: string | null
          createdAt?: string
          createdById: string
          deletedAt?: string | null
          description?: string | null
          endTime?: string | null
          id?: string
          isPublic?: boolean
          isRecurring?: boolean
          location?: string | null
          orgId: string
          startTime?: string | null
          status?: Database["public"]["Enums"]["EventStatus"]
          targetRoles?: Database["public"]["Enums"]["Role"][] | null
          title: string
          type?: Database["public"]["Enums"]["EventType"]
          updatedAt: string
        }
        Update: {
          color?: string | null
          createdAt?: string
          createdById?: string
          deletedAt?: string | null
          description?: string | null
          endTime?: string | null
          id?: string
          isPublic?: boolean
          isRecurring?: boolean
          location?: string | null
          orgId?: string
          startTime?: string | null
          status?: Database["public"]["Enums"]["EventStatus"]
          targetRoles?: Database["public"]["Enums"]["Role"][] | null
          title?: string
          type?: Database["public"]["Enums"]["EventType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Event_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Event_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      EventParticipant: {
        Row: {
          eventId: string
          id: string
          joinedAt: string
          role: Database["public"]["Enums"]["ParticipantRole"]
          status: Database["public"]["Enums"]["EventStatus"]
          userId: string
        }
        Insert: {
          eventId: string
          id?: string
          joinedAt?: string
          role?: Database["public"]["Enums"]["ParticipantRole"]
          status?: Database["public"]["Enums"]["EventStatus"]
          userId: string
        }
        Update: {
          eventId?: string
          id?: string
          joinedAt?: string
          role?: Database["public"]["Enums"]["ParticipantRole"]
          status?: Database["public"]["Enums"]["EventStatus"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "EventParticipant_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EventParticipant_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Function: {
        Row: {
          createdAt: string
          description: string | null
          icon: string | null
          id: string
          isMain: boolean
          name: string
          orgId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          isMain?: boolean
          name: string
          orgId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          isMain?: boolean
          name?: string
          orgId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Function_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Group: {
        Row: {
          classId: string
          createdAt: string
          deletedAt: string | null
          description: string | null
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          name: string
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Group_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
        ]
      }
      Invitation: {
        Row: {
          createdAt: string
          details: Json | null
          email: string
          expiresAt: string | null
          id: string
          invitationType: Database["public"]["Enums"]["InvitationType"]
          orgId: string
          resourceId: string | null
          resourceType: Database["public"]["Enums"]["Resource"] | null
          token: string
          usedAt: string | null
          userId: string | null
        }
        Insert: {
          createdAt?: string
          details?: Json | null
          email: string
          expiresAt?: string | null
          id?: string
          invitationType?: Database["public"]["Enums"]["InvitationType"]
          orgId: string
          resourceId?: string | null
          resourceType?: Database["public"]["Enums"]["Resource"] | null
          token: string
          usedAt?: string | null
          userId?: string | null
        }
        Update: {
          createdAt?: string
          details?: Json | null
          email?: string
          expiresAt?: string | null
          id?: string
          invitationType?: Database["public"]["Enums"]["InvitationType"]
          orgId?: string
          resourceId?: string | null
          resourceType?: Database["public"]["Enums"]["Resource"] | null
          token?: string
          usedAt?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Invitation_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Invitation_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Justification: {
        Row: {
          createdAt: string
          declaredById: string
          id: string
          orgId: string
          reason: string | null
          reviewComment: string | null
          reviewedAt: string | null
          reviewedById: string | null
          scheduleId: string
          status: Database["public"]["Enums"]["JustificationStatus"]
          studentId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          declaredById: string
          id?: string
          orgId: string
          reason?: string | null
          reviewComment?: string | null
          reviewedAt?: string | null
          reviewedById?: string | null
          scheduleId: string
          status?: Database["public"]["Enums"]["JustificationStatus"]
          studentId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          declaredById?: string
          id?: string
          orgId?: string
          reason?: string | null
          reviewComment?: string | null
          reviewedAt?: string | null
          reviewedById?: string | null
          scheduleId?: string
          status?: Database["public"]["Enums"]["JustificationStatus"]
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Justification_declaredById_fkey"
            columns: ["declaredById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Justification_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Justification_reviewedById_fkey"
            columns: ["reviewedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Justification_scheduleId_fkey"
            columns: ["scheduleId"]
            isOneToOne: false
            referencedRelation: "Schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Justification_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Location: {
        Row: {
          active: boolean
          address: string
          createdAt: string
          id: string
          latitude: number
          longitude: number
          name: string
          orgId: string
          position: unknown
          radius: number
          updatedAt: string
        }
        Insert: {
          active?: boolean
          address: string
          createdAt?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          orgId: string
          position?: unknown
          radius?: number
          updatedAt: string
        }
        Update: {
          active?: boolean
          address?: string
          createdAt?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          orgId?: string
          position?: unknown
          radius?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Location_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Message: {
        Row: {
          channelId: string
          content: string
          createdAt: string
          deletedAt: string | null
          id: string
          parentId: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          channelId: string
          content: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          parentId?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          channelId?: string
          content?: string
          createdAt?: string
          deletedAt?: string | null
          id?: string
          parentId?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_channelId_fkey"
            columns: ["channelId"]
            isOneToOne: false
            referencedRelation: "Channel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Message_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Message_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          createdAt: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          scheduleId: string | null
          type: Database["public"]["Enums"]["NotificationType"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          scheduleId?: string | null
          type?: Database["public"]["Enums"]["NotificationType"]
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          scheduleId?: string | null
          type?: Database["public"]["Enums"]["NotificationType"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_scheduleId_fkey"
            columns: ["scheduleId"]
            isOneToOne: false
            referencedRelation: "Schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      OptionalUE: {
        Row: {
          createdAt: string
          id: string
          isActive: boolean
          studentId: string
          ueId: string
          updatedAt: string
          yearId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          isActive?: boolean
          studentId: string
          ueId: string
          updatedAt: string
          yearId: string
        }
        Update: {
          createdAt?: string
          id?: string
          isActive?: boolean
          studentId?: string
          ueId?: string
          updatedAt?: string
          yearId?: string
        }
        Relationships: [
          {
            foreignKeyName: "OptionalUE_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OptionalUE_ueId_fkey"
            columns: ["ueId"]
            isOneToOne: false
            referencedRelation: "UE"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OptionalUE_yearId_fkey"
            columns: ["yearId"]
            isOneToOne: false
            referencedRelation: "AcademicYear"
            referencedColumns: ["id"]
          },
        ]
      }
      Organization: {
        Row: {
          createdAt: string
          deletedAt: string | null
          details: Json | null
          domain: string | null
          email: string | null
          id: string
          isActive: boolean
          logo: string | null
          name: string
          slug: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          details?: Json | null
          domain?: string | null
          email?: string | null
          id?: string
          isActive?: boolean
          logo?: string | null
          name: string
          slug?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          details?: Json | null
          domain?: string | null
          email?: string | null
          id?: string
          isActive?: boolean
          logo?: string | null
          name?: string
          slug?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      OrganizationSettings: {
        Row: {
          breakDuration: number
          currency: string
          emailNotifications: boolean
          id: string
          language: string
          maxClasses: number | null
          maxCourses: number | null
          maxRooms: number | null
          maxUsers: number
          orgId: string
          parentalNotifications: boolean
          settings: Json | null
          smsNotifications: boolean
          storageLimit: number
          timezone: string
          updatedAt: string
        }
        Insert: {
          breakDuration?: number
          currency?: string
          emailNotifications?: boolean
          id?: string
          language?: string
          maxClasses?: number | null
          maxCourses?: number | null
          maxRooms?: number | null
          maxUsers?: number
          orgId: string
          parentalNotifications?: boolean
          settings?: Json | null
          smsNotifications?: boolean
          storageLimit?: number
          timezone?: string
          updatedAt: string
        }
        Update: {
          breakDuration?: number
          currency?: string
          emailNotifications?: boolean
          id?: string
          language?: string
          maxClasses?: number | null
          maxCourses?: number | null
          maxRooms?: number | null
          maxUsers?: number
          orgId?: string
          parentalNotifications?: boolean
          settings?: Json | null
          smsNotifications?: boolean
          storageLimit?: number
          timezone?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrganizationSettings_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      OrganizationUsage: {
        Row: {
          activeCourses: number
          activeRooms: number
          currentUsers: number
          id: string
          orgId: string
          updatedAt: string
          usedStorage: number
        }
        Insert: {
          activeCourses?: number
          activeRooms?: number
          currentUsers?: number
          id?: string
          orgId: string
          updatedAt: string
          usedStorage?: number
        }
        Update: {
          activeCourses?: number
          activeRooms?: number
          currentUsers?: number
          id?: string
          orgId?: string
          updatedAt?: string
          usedStorage?: number
        }
        Relationships: [
          {
            foreignKeyName: "OrganizationUsage_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Parent: {
        Row: {
          createdAt: string
          deletedAt: string | null
          id: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          orgId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Parent_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ParentRelation: {
        Row: {
          createdAt: string
          id: string
          orgId: string
          parentId: string
          relation: string
          studentId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          orgId: string
          parentId: string
          relation: string
          studentId: string
        }
        Update: {
          createdAt?: string
          id?: string
          orgId?: string
          parentId?: string
          relation?: string
          studentId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ParentRelation_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ParentRelation_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "Parent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ParentRelation_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      Permission: {
        Row: {
          action: Database["public"]["Enums"]["Action"]
          assignedById: string | null
          createdAt: string
          description: string | null
          details: Json | null
          expiresAt: string | null
          functionId: string | null
          id: string
          isActive: boolean
          orgId: string | null
          resource: Database["public"]["Enums"]["Resource"] | null
          resourceId: string | null
          updatedAt: string
          userId: string | null
        }
        Insert: {
          action?: Database["public"]["Enums"]["Action"]
          assignedById?: string | null
          createdAt?: string
          description?: string | null
          details?: Json | null
          expiresAt?: string | null
          functionId?: string | null
          id?: string
          isActive?: boolean
          orgId?: string | null
          resource?: Database["public"]["Enums"]["Resource"] | null
          resourceId?: string | null
          updatedAt: string
          userId?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["Action"]
          assignedById?: string | null
          createdAt?: string
          description?: string | null
          details?: Json | null
          expiresAt?: string | null
          functionId?: string | null
          id?: string
          isActive?: boolean
          orgId?: string | null
          resource?: Database["public"]["Enums"]["Resource"] | null
          resourceId?: string | null
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Permission_assignedById_fkey"
            columns: ["assignedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Permission_functionId_fkey"
            columns: ["functionId"]
            isOneToOne: false
            referencedRelation: "Function"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Permission_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Permission_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Program: {
        Row: {
          createdAt: string
          deletedAt: string | null
          description: string | null
          id: string
          name: string
          orgId: string
          programTrackId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          name: string
          orgId: string
          programTrackId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          description?: string | null
          id?: string
          name?: string
          orgId?: string
          programTrackId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Program_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Program_programTrackId_fkey"
            columns: ["programTrackId"]
            isOneToOne: false
            referencedRelation: "ProgramTrack"
            referencedColumns: ["id"]
          },
        ]
      }
      ProgramTrack: {
        Row: {
          departmentId: string
          description: string | null
          id: string
          name: string
          orgId: string
        }
        Insert: {
          departmentId: string
          description?: string | null
          id?: string
          name: string
          orgId: string
        }
        Update: {
          departmentId?: string
          description?: string | null
          id?: string
          name?: string
          orgId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProgramTrack_departmentId_fkey"
            columns: ["departmentId"]
            isOneToOne: false
            referencedRelation: "Department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProgramTrack_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      ProgramUE: {
        Row: {
          createdAt: string
          id: string
          isCompleted: boolean
          isOptional: boolean
          order: number | null
          programId: string
          semester: number
          ueId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          isCompleted?: boolean
          isOptional?: boolean
          order?: number | null
          programId: string
          semester?: number
          ueId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: string
          isCompleted?: boolean
          isOptional?: boolean
          order?: number | null
          programId?: string
          semester?: number
          ueId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ProgramUE_programId_fkey"
            columns: ["programId"]
            isOneToOne: false
            referencedRelation: "Program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProgramUE_ueId_fkey"
            columns: ["ueId"]
            isOneToOne: false
            referencedRelation: "UE"
            referencedColumns: ["id"]
          },
        ]
      }
      PushSubscription: {
        Row: {
          auth: string
          createdAt: string
          deviceId: string | null
          endpoint: string
          expiresAt: string | null
          id: string
          p256dh: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          auth: string
          createdAt?: string
          deviceId?: string | null
          endpoint: string
          expiresAt?: string | null
          id?: string
          p256dh: string
          updatedAt: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          auth?: string
          createdAt?: string
          deviceId?: string | null
          endpoint?: string
          expiresAt?: string | null
          id?: string
          p256dh?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PushSubscription_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      QRCode: {
        Row: {
          active: boolean
          code: string
          createdAt: string
          expiresAt: string | null
          id: string
          roomId: string
          updatedAt: string
        }
        Insert: {
          active?: boolean
          code: string
          createdAt?: string
          expiresAt?: string | null
          id?: string
          roomId: string
          updatedAt: string
        }
        Update: {
          active?: boolean
          code?: string
          createdAt?: string
          expiresAt?: string | null
          id?: string
          roomId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "QRCode_roomId_fkey"
            columns: ["roomId"]
            isOneToOne: false
            referencedRelation: "Room"
            referencedColumns: ["id"]
          },
        ]
      }
      QRScan: {
        Row: {
          id: string
          ipAddress: string | null
          qrCodeId: string
          sessionId: string | null
          timestamp: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          id?: string
          ipAddress?: string | null
          qrCodeId: string
          sessionId?: string | null
          timestamp?: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          id?: string
          ipAddress?: string | null
          qrCodeId?: string
          sessionId?: string | null
          timestamp?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "QRScan_qrCodeId_fkey"
            columns: ["qrCodeId"]
            isOneToOne: false
            referencedRelation: "QRCode"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "QRScan_sessionId_fkey"
            columns: ["sessionId"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "QRScan_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      RealtimeItem: {
        Row: {
          channelId: string
          id: string
          itemId: string
          updatedAt: string
          x: number
          y: number
        }
        Insert: {
          channelId: string
          id?: string
          itemId: string
          updatedAt: string
          x: number
          y: number
        }
        Update: {
          channelId?: string
          id?: string
          itemId?: string
          updatedAt?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "RealtimeItem_channelId_fkey"
            columns: ["channelId"]
            isOneToOne: false
            referencedRelation: "Channel"
            referencedColumns: ["id"]
          },
        ]
      }
      Room: {
        Row: {
          capacity: number | null
          createdAt: string
          deletedAt: string | null
          equipment: string[] | null
          id: string
          locationId: string | null
          name: string
          orgId: string
          updatedAt: string
        }
        Insert: {
          capacity?: number | null
          createdAt?: string
          deletedAt?: string | null
          equipment?: string[] | null
          id?: string
          locationId?: string | null
          name: string
          orgId: string
          updatedAt: string
        }
        Update: {
          capacity?: number | null
          createdAt?: string
          deletedAt?: string | null
          equipment?: string[] | null
          id?: string
          locationId?: string | null
          name?: string
          orgId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Room_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Room_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      Schedule: {
        Row: {
          classId: string
          confirmed: boolean
          courseId: string
          createdAt: string
          deletedAt: string | null
          during: unknown
          endTime: string
          groupId: string | null
          id: string
          notes: string | null
          notifiedAt: string | null
          notifyState: Database["public"]["Enums"]["ScheduleNotifyState"] | null
          orgId: string
          roomId: string
          startTime: string
          status: Database["public"]["Enums"]["ScheduleStatus"]
          statusChangedAt: string | null
          teacherId: string
          updatedAt: string
          weekRecurrenceId: string | null
        }
        Insert: {
          classId: string
          confirmed?: boolean
          courseId: string
          createdAt?: string
          deletedAt?: string | null
          during?: unknown
          endTime: string
          groupId?: string | null
          id?: string
          notes?: string | null
          notifiedAt?: string | null
          notifyState?:
            | Database["public"]["Enums"]["ScheduleNotifyState"]
            | null
          orgId: string
          roomId: string
          startTime: string
          status?: Database["public"]["Enums"]["ScheduleStatus"]
          statusChangedAt?: string | null
          teacherId: string
          updatedAt: string
          weekRecurrenceId?: string | null
        }
        Update: {
          classId?: string
          confirmed?: boolean
          courseId?: string
          createdAt?: string
          deletedAt?: string | null
          during?: unknown
          endTime?: string
          groupId?: string | null
          id?: string
          notes?: string | null
          notifiedAt?: string | null
          notifyState?:
            | Database["public"]["Enums"]["ScheduleNotifyState"]
            | null
          orgId?: string
          roomId?: string
          startTime?: string
          status?: Database["public"]["Enums"]["ScheduleStatus"]
          statusChangedAt?: string | null
          teacherId?: string
          updatedAt?: string
          weekRecurrenceId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Schedule_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Schedule_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "Course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Schedule_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Schedule_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Schedule_roomId_fkey"
            columns: ["roomId"]
            isOneToOne: false
            referencedRelation: "Room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Schedule_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Schedule_weekRecurrenceId_fkey"
            columns: ["weekRecurrenceId"]
            isOneToOne: false
            referencedRelation: "WeekRecurence"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          checkIn: string | null
          checkInMethod:
            | Database["public"]["Enums"]["VerificationMethod"]
            | null
          checkOut: string | null
          checkOutMethod:
            | Database["public"]["Enums"]["VerificationMethod"]
            | null
          createdAt: string
          durationMinutes: number | null
          endedAutomatically: boolean
          id: string
          isLate: boolean
          locationId: string | null
          position: unknown
          scheduleId: string
          status: Database["public"]["Enums"]["SessionStatus"]
          updatedAt: string
        }
        Insert: {
          checkIn?: string | null
          checkInMethod?:
            | Database["public"]["Enums"]["VerificationMethod"]
            | null
          checkOut?: string | null
          checkOutMethod?:
            | Database["public"]["Enums"]["VerificationMethod"]
            | null
          createdAt?: string
          durationMinutes?: number | null
          endedAutomatically?: boolean
          id?: string
          isLate?: boolean
          locationId?: string | null
          position?: unknown
          scheduleId: string
          status?: Database["public"]["Enums"]["SessionStatus"]
          updatedAt: string
        }
        Update: {
          checkIn?: string | null
          checkInMethod?:
            | Database["public"]["Enums"]["VerificationMethod"]
            | null
          checkOut?: string | null
          checkOutMethod?:
            | Database["public"]["Enums"]["VerificationMethod"]
            | null
          createdAt?: string
          durationMinutes?: number | null
          endedAutomatically?: boolean
          id?: string
          isLate?: boolean
          locationId?: string | null
          position?: unknown
          scheduleId?: string
          status?: Database["public"]["Enums"]["SessionStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_locationId_fkey"
            columns: ["locationId"]
            isOneToOne: false
            referencedRelation: "Location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Session_scheduleId_fkey"
            columns: ["scheduleId"]
            isOneToOne: false
            referencedRelation: "Schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      SessionToken: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          sessionId: string
          token: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id?: string
          sessionId: string
          token?: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          sessionId?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "SessionToken_sessionId_fkey"
            columns: ["sessionId"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      Student: {
        Row: {
          createdAt: string
          deletedAt: string | null
          id: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          orgId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Student_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      StudentEnrollment: {
        Row: {
          classId: string
          createdAt: string
          endedAt: string | null
          id: string
          studentId: string
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          endedAt?: string | null
          id?: string
          studentId: string
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          endedAt?: string | null
          id?: string
          studentId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "StudentEnrollment_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StudentEnrollment_studentId_fkey"
            columns: ["studentId"]
            isOneToOne: false
            referencedRelation: "Student"
            referencedColumns: ["id"]
          },
        ]
      }
      StudentGroup: {
        Row: {
          createdAt: string
          enrollmentId: string
          groupId: string
          id: string
        }
        Insert: {
          createdAt?: string
          enrollmentId: string
          groupId: string
          id?: string
        }
        Update: {
          createdAt?: string
          enrollmentId?: string
          groupId?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "StudentGroup_enrollmentId_fkey"
            columns: ["enrollmentId"]
            isOneToOne: false
            referencedRelation: "StudentEnrollment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StudentGroup_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
        ]
      }
      SuperAdmin: {
        Row: {
          createdAt: string
          email: string
          id: string
          metadata: Json | null
        }
        Insert: {
          createdAt?: string
          email: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      Teacher: {
        Row: {
          createdAt: string
          deletedAt: string | null
          departmentId: string | null
          id: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          departmentId?: string | null
          id?: string
          orgId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          departmentId?: string | null
          id?: string
          orgId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Teacher_departmentId_fkey"
            columns: ["departmentId"]
            isOneToOne: false
            referencedRelation: "Department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Teacher_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      TeacherUnavailability: {
        Row: {
          createdAt: string
          dayOfWeek: number | null
          endDate: string | null
          endTime: string | null
          id: string
          orgId: string
          reason: string | null
          startDate: string | null
          startTime: string | null
          teacherId: string
          type: Database["public"]["Enums"]["UnavailabilityType"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          dayOfWeek?: number | null
          endDate?: string | null
          endTime?: string | null
          id?: string
          orgId: string
          reason?: string | null
          startDate?: string | null
          startTime?: string | null
          teacherId: string
          type: Database["public"]["Enums"]["UnavailabilityType"]
          updatedAt: string
        }
        Update: {
          createdAt?: string
          dayOfWeek?: number | null
          endDate?: string | null
          endTime?: string | null
          id?: string
          orgId?: string
          reason?: string | null
          startDate?: string | null
          startTime?: string | null
          teacherId?: string
          type?: Database["public"]["Enums"]["UnavailabilityType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeacherUnavailability_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeacherUnavailability_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
        ]
      }
      Term: {
        Row: {
          classId: string
          createdAt: string
          endDate: string | null
          id: string
          lockedAt: string | null
          name: string
          order: number
          startDate: string | null
          updatedAt: string
        }
        Insert: {
          classId: string
          createdAt?: string
          endDate?: string | null
          id?: string
          lockedAt?: string | null
          name: string
          order: number
          startDate?: string | null
          updatedAt: string
        }
        Update: {
          classId?: string
          createdAt?: string
          endDate?: string | null
          id?: string
          lockedAt?: string | null
          name?: string
          order?: number
          startDate?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Term_classId_fkey"
            columns: ["classId"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["id"]
          },
        ]
      }
      UE: {
        Row: {
          code: string | null
          createdAt: string
          deletedAt: string | null
          departmentId: string | null
          description: string | null
          id: string
          imageUrl: string | null
          isOptional: boolean
          name: string
          orgId: string
          updatedAt: string
        }
        Insert: {
          code?: string | null
          createdAt?: string
          deletedAt?: string | null
          departmentId?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isOptional?: boolean
          name: string
          orgId: string
          updatedAt: string
        }
        Update: {
          code?: string | null
          createdAt?: string
          deletedAt?: string | null
          departmentId?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          isOptional?: boolean
          name?: string
          orgId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "UE_departmentId_fkey"
            columns: ["departmentId"]
            isOneToOne: false
            referencedRelation: "Department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UE_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      UECourse: {
        Row: {
          code: string | null
          createdAt: string
          credits: number
          deletedAt: string | null
          description: string | null
          duration: number
          id: string
          imageUrl: string | null
          name: string
          order: number | null
          orgId: string
          settings: Json | null
          ueId: string
          updatedAt: string
        }
        Insert: {
          code?: string | null
          createdAt?: string
          credits?: number
          deletedAt?: string | null
          description?: string | null
          duration?: number
          id?: string
          imageUrl?: string | null
          name: string
          order?: number | null
          orgId: string
          settings?: Json | null
          ueId: string
          updatedAt: string
        }
        Update: {
          code?: string | null
          createdAt?: string
          credits?: number
          deletedAt?: string | null
          description?: string | null
          duration?: number
          id?: string
          imageUrl?: string | null
          name?: string
          order?: number | null
          orgId?: string
          settings?: Json | null
          ueId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "UECourse_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UECourse_ueId_fkey"
            columns: ["ueId"]
            isOneToOne: false
            referencedRelation: "UE"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          avatar_url: string | null
          createdAt: string
          dateOfBirth: string | null
          deletedAt: string | null
          details: Json | null
          email: string
          firstName: string | null
          id: string
          isConnected: boolean
          lastName: string | null
          phone: string | null
          sex: Database["public"]["Enums"]["Sex"]
          status: Database["public"]["Enums"]["UserStatus"]
          updatedAt: string
        }
        Insert: {
          avatar_url?: string | null
          createdAt?: string
          dateOfBirth?: string | null
          deletedAt?: string | null
          details?: Json | null
          email: string
          firstName?: string | null
          id?: string
          isConnected?: boolean
          lastName?: string | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["Sex"]
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt: string
        }
        Update: {
          avatar_url?: string | null
          createdAt?: string
          dateOfBirth?: string | null
          deletedAt?: string | null
          details?: Json | null
          email?: string
          firstName?: string | null
          id?: string
          isConnected?: boolean
          lastName?: string | null
          phone?: string | null
          sex?: Database["public"]["Enums"]["Sex"]
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt?: string
        }
        Relationships: []
      }
      UserFunction: {
        Row: {
          assignedAt: string
          assignedBy: string | null
          functionId: string
          id: string
          userId: string
        }
        Insert: {
          assignedAt?: string
          assignedBy?: string | null
          functionId: string
          id?: string
          userId: string
        }
        Update: {
          assignedAt?: string
          assignedBy?: string | null
          functionId?: string
          id?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserFunction_functionId_fkey"
            columns: ["functionId"]
            isOneToOne: false
            referencedRelation: "Function"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserFunction_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      UserOrganization: {
        Row: {
          createdAt: string
          departmentId: string | null
          id: string
          isMainOrg: boolean
          isResponsable: boolean
          orgId: string
          role: Database["public"]["Enums"]["Role"]
          status: Database["public"]["Enums"]["UserStatus"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          departmentId?: string | null
          id?: string
          isMainOrg?: boolean
          isResponsable?: boolean
          orgId: string
          role?: Database["public"]["Enums"]["Role"]
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          departmentId?: string | null
          id?: string
          isMainOrg?: boolean
          isResponsable?: boolean
          orgId?: string
          role?: Database["public"]["Enums"]["Role"]
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserOrganization_departmentId_fkey"
            columns: ["departmentId"]
            isOneToOne: false
            referencedRelation: "Department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserOrganization_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserOrganization_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      WeeklySlot: {
        Row: {
          courseId: string
          createdAt: string
          dayOfWeek: number
          deletedAt: string | null
          endTime: string
          id: string
          isActive: boolean
          roomId: string
          startTime: string
          teacherId: string
          templateId: string
          updatedAt: string
        }
        Insert: {
          courseId: string
          createdAt?: string
          dayOfWeek: number
          deletedAt?: string | null
          endTime: string
          id?: string
          isActive?: boolean
          roomId: string
          startTime: string
          teacherId: string
          templateId: string
          updatedAt: string
        }
        Update: {
          courseId?: string
          createdAt?: string
          dayOfWeek?: number
          deletedAt?: string | null
          endTime?: string
          id?: string
          isActive?: boolean
          roomId?: string
          startTime?: string
          teacherId?: string
          templateId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WeeklySlot_courseId_fkey"
            columns: ["courseId"]
            isOneToOne: false
            referencedRelation: "Course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WeeklySlot_roomId_fkey"
            columns: ["roomId"]
            isOneToOne: false
            referencedRelation: "Room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WeeklySlot_teacherId_fkey"
            columns: ["teacherId"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WeeklySlot_templateId_fkey"
            columns: ["templateId"]
            isOneToOne: false
            referencedRelation: "WeeklyTemplate"
            referencedColumns: ["id"]
          },
        ]
      }
      WeeklyTemplate: {
        Row: {
          createdAt: string
          deletedAt: string | null
          id: string
          isActive: boolean
          name: string
          orgId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          isActive?: boolean
          name: string
          orgId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          id?: string
          isActive?: boolean
          name?: string
          orgId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WeeklyTemplate_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
        ]
      }
      WeekRecurence: {
        Row: {
          createdAt: string
          deletedAt: string | null
          endDate: string
          excludedDates: string[] | null
          id: string
          interval: number
          isActive: boolean
          orgId: string
          startDate: string
          templateId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          endDate: string
          excludedDates?: string[] | null
          id?: string
          interval?: number
          isActive?: boolean
          orgId: string
          startDate: string
          templateId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          endDate?: string
          excludedDates?: string[] | null
          id?: string
          interval?: number
          isActive?: boolean
          orgId?: string
          startDate?: string
          templateId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WeekRecurence_orgId_fkey"
            columns: ["orgId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WeekRecurence_templateId_fkey"
            columns: ["templateId"]
            isOneToOne: false
            referencedRelation: "WeeklyTemplate"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      Action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "CRUD"
      ApprovalStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED"
      AttendanceStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "PENDING"
      ChannelType: "CLASS" | "GROUP" | "ORG" | "DM"
      DocumentType:
        | "GENERAL"
        | "ACADEMIC"
        | "PROFILE"
        | "PEDAGOGY"
        | "JUSTIFICATION"
        | "MEDICAL"
        | "DISCIPLINE"
      EvaluationType: "DEVOIR" | "EXAMEN" | "PARTICIPATION" | "PROJET"
      EventStatus: "PENDING" | "ACCEPTED" | "DECLINED"
      EventType: "MEETING" | "EXAM" | "COURSE" | "GENERAL" | "ADMINISTRATIVE"
      InvitationType: "DIRECT_CREATE" | "INVITE_ONLY" | "STUDENT"
      JustificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED"
      Level: "L1" | "L2" | "L3" | "M1" | "M2" | "D1" | "D2" | "D3"
      NotificationType:
        | "ABSENCE"
        | "COURSE_CHANGE"
        | "NEW_COURSE"
        | "SCHEDULE_UPDATE"
        | "GENERAL"
        | "MESSAGE"
        | "INVITATION"
      ParticipantRole: "OWNER" | "MEMBER"
      Resource:
        | "COURSE"
        | "SCHEDULE"
        | "USER"
        | "STUDENT"
        | "TEACHER"
        | "ROOM"
        | "LOCATION"
        | "PROGRAM"
        | "FILIERE"
        | "ATTENDANCE"
        | "GRADE"
        | "CLASS"
        | "MESSAGE"
        | "JUSTIFICATION"
      Role:
        | "ADMIN"
        | "TEACHER"
        | "SUPER_ADMIN"
        | "STUDENT"
        | "PARENT"
        | "DIRECTION"
      ScheduleNotifyState: "PENDING" | "SENT"
      ScheduleStatus: "PENDING" | "COMPLETED" | "CANCELED" | "MISSED"
      SessionStatus: "ACTIVE" | "CANCELED" | "COMPLETED"
      Sex: "MALE" | "FEMALE" | "OTHER"
      UnavailabilityType: "WEEKLY" | "DATE_RANGE"
      UserStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ON_LEAVE" | "PENDING"
      VerificationMethod:
        | "QR"
        | "GPS"
        | "ADMIN_OVERRIDE"
        | "WIFI"
        | "FACE_RECOGNITION"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      Action: ["CREATE", "READ", "UPDATE", "DELETE", "CRUD"],
      ApprovalStatus: ["PENDING", "APPROVED", "REJECTED", "CANCELED"],
      AttendanceStatus: ["PRESENT", "ABSENT", "LATE", "EXCUSED", "PENDING"],
      ChannelType: ["CLASS", "GROUP", "ORG", "DM"],
      DocumentType: [
        "GENERAL",
        "ACADEMIC",
        "PROFILE",
        "PEDAGOGY",
        "JUSTIFICATION",
        "MEDICAL",
        "DISCIPLINE",
      ],
      EvaluationType: ["DEVOIR", "EXAMEN", "PARTICIPATION", "PROJET"],
      EventStatus: ["PENDING", "ACCEPTED", "DECLINED"],
      EventType: ["MEETING", "EXAM", "COURSE", "GENERAL", "ADMINISTRATIVE"],
      InvitationType: ["DIRECT_CREATE", "INVITE_ONLY", "STUDENT"],
      JustificationStatus: ["PENDING", "APPROVED", "REJECTED", "CANCELED"],
      Level: ["L1", "L2", "L3", "M1", "M2", "D1", "D2", "D3"],
      NotificationType: [
        "ABSENCE",
        "COURSE_CHANGE",
        "NEW_COURSE",
        "SCHEDULE_UPDATE",
        "GENERAL",
        "MESSAGE",
        "INVITATION",
      ],
      ParticipantRole: ["OWNER", "MEMBER"],
      Resource: [
        "COURSE",
        "SCHEDULE",
        "USER",
        "STUDENT",
        "TEACHER",
        "ROOM",
        "LOCATION",
        "PROGRAM",
        "FILIERE",
        "ATTENDANCE",
        "GRADE",
        "CLASS",
        "MESSAGE",
        "JUSTIFICATION",
      ],
      Role: [
        "ADMIN",
        "TEACHER",
        "SUPER_ADMIN",
        "STUDENT",
        "PARENT",
        "DIRECTION",
      ],
      ScheduleNotifyState: ["PENDING", "SENT"],
      ScheduleStatus: ["PENDING", "COMPLETED", "CANCELED", "MISSED"],
      SessionStatus: ["ACTIVE", "CANCELED", "COMPLETED"],
      Sex: ["MALE", "FEMALE", "OTHER"],
      UnavailabilityType: ["WEEKLY", "DATE_RANGE"],
      UserStatus: ["ACTIVE", "INACTIVE", "SUSPENDED", "ON_LEAVE", "PENDING"],
      VerificationMethod: [
        "QR",
        "GPS",
        "ADMIN_OVERRIDE",
        "WIFI",
        "FACE_RECOGNITION",
      ],
    },
  },
} as const
