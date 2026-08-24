"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridPattern } from '@/components/ui/grid-pattern';

// ==================== TYPES ====================

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'PENDING';
type Sex = 'MALE' | 'FEMALE' | 'OTHER';

type TeacherProfileData = {
  id: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    sex: Sex;
    dateOfBirth?: string;
    status: UserStatus;
    createdAt: string;
  };
  department?: {
    id: string;
    name: string;
  };
  courses: {
    id: string;
    isMain: boolean;
    course: {
      name: string;
      duration: [number, number]; // [effectué, total]
      class: {
        name: string;
        level: string;
      };
    };
    room?: string;
  }[];
  schedules: {
    day: 'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN';
    startHour: number;
    courseName: string;
    room?: string;
    colorKey: 'blue' | 'green' | 'amber' | 'purple';
  }[];
  skills?: string[];
};

// ==================== MOCK DATA ====================

const mockTeacher: TeacherProfileData = {
  id: '4',
  user: {
    firstName: 'Akosua',
    lastName: 'Boateng',
    email: 'a.boateng@univ.tg',
    phone: '+228 90 11 22 33',
    avatar_url: 'https://randomuser.me/api/portraits/women/14.jpg',
    sex: 'FEMALE',
    dateOfBirth: '1988-03-14',
    status: 'ACTIVE',
    createdAt: '2019-09-01',
  },
  department: { id: 'd2', name: 'Informatique' },
  courses: [
    {
      id: 'c1',
      isMain: true,
      course: { name: 'Algorithmique', duration: [26, 36], class: { name: 'L1 Info', level: 'L1' } },
      room: 'Salle A12',
    },
    {
      id: 'c2',
      isMain: false,
      course: { name: 'Structures de données', duration: [12, 24], class: { name: 'L2 Info', level: 'L2' } },
      room: 'Labo B04',
    },
    {
      id: 'c3',
      isMain: true,
      course: { name: 'Programmation Web', duration: [4, 14], class: { name: 'L2 Info', level: 'L2' } },
      room: 'Salle C08',
    },
  ],
  schedules: [
    { day: 'LUN', startHour: 8,  courseName: 'Algorithmique',      room: 'Salle A12', colorKey: 'blue' },
    { day: 'MER', startHour: 8,  courseName: 'Algorithmique',      room: 'Salle A12', colorKey: 'blue' },
    { day: 'MAR', startHour: 10, courseName: 'Struct. données',    room: 'Labo B04',  colorKey: 'green' },
    { day: 'JEU', startHour: 10, courseName: 'Struct. données',    room: 'Labo B04',  colorKey: 'green' },
    { day: 'VEN', startHour: 14, courseName: 'Programmation Web',  room: 'Salle C08', colorKey: 'amber' },
  ],
  skills: ['Algorithmique', 'Structures de données', 'Python', 'C/C++', 'Programmation Web', 'Bases de données'],
};

// ==================== HELPERS ====================

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; dot: string }> = {
  ACTIVE:    { label: 'Actif',     color: 'text-emerald-600', dot: 'bg-emerald-500' },
  INACTIVE:  { label: 'Inactif',   color: 'text-gray-400',    dot: 'bg-gray-400' },
  SUSPENDED: { label: 'Suspendu',  color: 'text-red-500',     dot: 'bg-red-500' },
  ON_LEAVE:  { label: 'En congé',  color: 'text-amber-500',   dot: 'bg-amber-500' },
  PENDING:   { label: 'En attente',color: 'text-blue-500',    dot: 'bg-blue-500' },
};

const SEX_LABEL: Record<Sex, string> = { MALE: 'Homme', FEMALE: 'Femme', OTHER: 'Autre' };

const COURSE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',bar: 'bg-emerald-500' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  bar: 'bg-amber-500' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-700', bar: 'bg-violet-500' },
};

const SCHEDULE_COLORS = COURSE_COLORS;

const DAYS: Array<'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN'> = ['LUN', 'MAR', 'MER', 'JEU', 'VEN'];
const HOURS = [8, 10, 14];

function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatJoined(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

function totalHours(courses: TeacherProfileData['courses']) {
  return courses.reduce((s, c) => s + c.course.duration[1], 0);
}

function uniqueClasses(courses: TeacherProfileData['courses']) {
  return new Set(courses.map((c) => c.course.class.name)).size;
}

// ==================== GRID DECORATION ====================

function GridDeco({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 [mask-image:linear-gradient(white,transparent)] ${className ?? ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-foreground/2 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
        <GridPattern
          width={22}
          height={22}
          x={-12}
          y={4}
          strokeDasharray="3"
          className="stroke-foreground/20 absolute inset-0 h-full w-full mix-blend-overlay"
        />
      </div>
    </div>
  );
}

// ==================== COLLAPSIBLE SECTION ====================

function CollapseSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 text-left mb-3"
      >
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 border-t border-dashed border-foreground/15" />
        <svg
          className={`size-3 text-muted-foreground/50 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== HERO CARD ====================

function HeroCard({ teacher }: { teacher: TeacherProfileData }) {
  const { user, department } = teacher;
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const status = STATUS_CONFIG[user.status];
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative grid grid-cols-[auto_1fr] gap-4 items-center overflow-hidden border border-dashed border-foreground/25 p-5">
      <GridDeco />

      {/* Avatar */}
      <div className="relative">
        {user.avatar_url && !imgError ? (
          <img
            src={user.avatar_url}
            alt={fullName}
            onError={() => setImgError(true)}
            className="size-[72px] rounded-full object-cover border-2 border-foreground/20"
          />
        ) : (
          <div className="size-[72px] rounded-full bg-foreground/10 border border-dashed border-foreground/20 flex items-center justify-center text-lg font-medium text-foreground/60">
            {getInitials(user.firstName, user.lastName)}
          </div>
        )}
        <span className={`absolute bottom-0.5 right-0.5 size-[11px] rounded-full border-2 border-background ${status.dot}`} />
      </div>

      {/* Info */}
      <div>
        <h1 className="text-xl font-medium tracking-tight leading-tight">{fullName}</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {user.email}{user.phone ? ` · ${user.phone}` : ''}
        </p>
        {department && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 border border-dashed border-blue-300/50 rounded-sm text-[11px] font-medium uppercase tracking-widest text-blue-600">
            <span className="size-2 rounded-[2px] border border-blue-500 flex-shrink-0" />
            {department.name}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STAT CARDS ====================

function StatsRow({ teacher }: { teacher: TeacherProfileData }) {
  const stats = [
    { label: 'Cours assignés', value: teacher.courses.length, unit: '' },
    { label: 'Volume horaire', value: totalHours(teacher.courses), unit: 'h' },
    { label: 'Classes', value: uniqueClasses(teacher.courses), unit: '' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ label, value, unit }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-foreground/[0.03] rounded-md p-3"
        >
          <div className="text-[22px] font-medium leading-none">
            {value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ==================== COURSE CARDS ====================

const COURSE_COLOR_KEYS = ['blue', 'green', 'amber', 'purple'] as const;

function CourseCards({ courses }: { courses: TeacherProfileData['courses'] }) {
  const [search, setSearch] = useState('');

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.course.name.toLowerCase().includes(q) ||
      c.course.class.name.toLowerCase().includes(q) ||
      (c.room ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher un cours, une classe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-[12px] bg-transparent border border-dashed border-foreground/20 rounded-sm outline-none focus:border-foreground/40 placeholder:text-muted-foreground/40 text-foreground"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
          >
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, idx) => {
            const colorKey = COURSE_COLOR_KEYS[idx % COURSE_COLOR_KEYS.length];
            const colors = COURSE_COLORS[colorKey];
            const [done, total] = c.course.duration;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="relative overflow-hidden border border-dashed border-foreground/25 p-3"
              >
                <GridDeco />
                <div className="relative">
                  {c.isMain ? (
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-sm mb-1.5 ${colors.bg} ${colors.text}`}>
                      Principal
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-sm mb-1.5 bg-foreground/5 text-muted-foreground">
                      Assistant
                    </span>
                  )}
                  <p className="text-[13px] font-medium">{c.course.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {c.course.class.name}
                    {c.room ? ` · ${c.room}` : ''}
                    {` · ${total}h`}
                  </p>
                  <div className="mt-2.5 h-[3px] bg-foreground/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                    <span>Progression</span>
                    <span>{done}h / {total}h</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center text-[12px] text-muted-foreground/50 py-6 border border-dashed border-foreground/10"
          >
            Aucun cours ne correspond à « {search} »
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ==================== SCHEDULE GRID ====================

function ScheduleGrid({ schedules }: { teacher: TeacherProfileData; schedules: TeacherProfileData['schedules'] }) {
  function getSlot(day: typeof DAYS[number], hour: number) {
    return schedules.find((s) => s.day === day && s.startHour === hour);
  }

  return (
    <div className="border border-dashed border-foreground/25 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-dashed border-foreground/15">
        <div className="border-r border-dashed border-foreground/15" />
        {DAYS.map((d) => (
          <div key={d} className="py-2 px-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-center border-r border-dashed border-foreground/15 last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Rows */}
      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-dashed border-foreground/15 last:border-b-0">
          <div className="py-2 px-1.5 text-[10px] text-muted-foreground border-r border-dashed border-foreground/15 self-center">
            {hour}h
          </div>
          {DAYS.map((day) => {
            const slot = getSlot(day, hour);
            const colors = slot ? SCHEDULE_COLORS[slot.colorKey] : null;
            return (
              <div key={day} className="min-h-[44px] p-1 border-r border-dashed border-foreground/15 last:border-r-0">
                {slot && colors && (
                  <div className={`h-full p-1.5 rounded-sm text-[10px] font-medium leading-snug ${colors.bg} ${colors.text}`}>
                    {slot.courseName}
                    {slot.room && (
                      <span className="block font-normal opacity-70">{slot.room}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ==================== INFO TABLE ====================

function InfoTable({ teacher }: { teacher: TeacherProfileData }) {
  const { user, department } = teacher;
  const status = STATUS_CONFIG[user.status];

  const rows = [
    { key: 'Statut',          value: <span className={status.color}>{status.label}</span> },
    { key: 'Département',     value: department?.name ?? '—' },
    { key: 'Genre',           value: SEX_LABEL[user.sex] },
    { key: 'Date de naissance', value: formatDate(user.dateOfBirth) },
    { key: 'Membre depuis',   value: formatJoined(user.createdAt) },
  ];

  return (
    <div className="border border-dashed border-foreground/25 px-4">
      {rows.map(({ key, value }) => (
        <div key={key} className="flex items-baseline justify-between py-2 border-b border-dashed border-foreground/15 last:border-b-0 text-[13px]">
          <span className="text-muted-foreground">{key}</span>
          <span className="font-medium text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== SKILLS ====================

function SkillTags({ skills }: { skills?: string[] }) {
  if (!skills?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span key={s} className="inline-block px-2 py-1 text-[11px] border border-dashed border-foreground/20 text-muted-foreground rounded-sm">
          {s}
        </span>
      ))}
    </div>
  );
}

// ==================== MAIN PAGE ====================

type TeacherProfilePageProps = {
  /**
   * Teacher data from API. Falls back to mock data if not provided.
   */
  teacher?: TeacherProfileData;
};

export function TeacherProfilePage({ teacher = mockTeacher }: TeacherProfilePageProps) {
  return (
    <section className="relative w-full pt-6 pb-16 px-4">
      {/* Background decorations */}
      <div aria-hidden className="absolute inset-0 isolate z-0 contain-strict pointer-events-none">
        <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.05)_0,hsla(0,0%,55%,.01)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 left-0 h-320 w-140 -translate-y-87.5 -rotate-45 rounded-full" />
      </div>

      <div className="relative mx-auto max-w-3xl space-y-0">
        <HeroCard teacher={teacher} />

        <CollapseSection label="Vue d'ensemble">
          <StatsRow teacher={teacher} />
        </CollapseSection>

        <CollapseSection label="Cours">
          <CourseCards courses={teacher.courses} />
        </CollapseSection>

        <CollapseSection label="Emploi du temps">
          <ScheduleGrid teacher={teacher} schedules={teacher.schedules} />
        </CollapseSection>

        <CollapseSection label="Informations">
          <InfoTable teacher={teacher} />
        </CollapseSection>

        {teacher.skills?.length ? (
          <CollapseSection label="Compétences">
            <SkillTags skills={teacher.skills} />
          </CollapseSection>
        ) : null}
      </div>
    </section>
  );
}

export type { TeacherProfileData };