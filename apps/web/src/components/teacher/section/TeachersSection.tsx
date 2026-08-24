"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridPattern } from '@/components/ui/grid-pattern';
import Link from 'next/link';

// ==================== TYPES ====================

type Teacher = {
	id: string;
	user: {
		firstName: string;
		lastName: string;
		email: string;
		avatar_url?: string;
		sex: 'MALE' | 'FEMALE' | 'OTHER';
	};
	department?: {
		id: string;
		name: string;
	};
	courses?: {
		course: {
			name: string;
		};
		isMain: boolean;
	}[];
};

type Department = {
	id: string;
	name: string;
	teachers: Teacher[];
};

// ==================== MOCK DATA ====================
// Remplacer par des données réelles depuis votre API

const mockTeachers: Teacher[] = [
	{
		id: '1',
		user: {
			firstName: 'Kwame',
			lastName: 'Mensah',
			email: 'k.mensah@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/men/11.jpg',
			sex: 'MALE',
		},
		department: { id: 'dept-1', name: 'Mathématiques' },
		courses: [
			{ course: { name: 'Algèbre Linéaire' }, isMain: true },
			{ course: { name: 'Analyse' }, isMain: false },
		],
	},
	{
		id: '2',
		user: {
			firstName: 'Ama',
			lastName: 'Asante',
			email: 'a.asante@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg',
			sex: 'FEMALE',
		},
		department: { id: 'dept-1', name: 'Mathématiques' },
		courses: [{ course: { name: 'Probabilités & Stats' }, isMain: true }],
	},
	{
		id: '3',
		user: {
			firstName: 'Kodjo',
			lastName: 'Attivor',
			email: 'k.attivor@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/men/13.jpg',
			sex: 'MALE',
		},
		department: { id: 'dept-1', name: 'Mathématiques' },
		courses: [{ course: { name: 'Géométrie' }, isMain: true }],
	},
	{
		id: '4',
		user: {
			firstName: 'Akosua',
			lastName: 'Boateng',
			email: 'a.boateng@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/women/14.jpg',
			sex: 'FEMALE',
		},
		department: { id: 'dept-2', name: 'Informatique' },
		courses: [
			{ course: { name: 'Algorithmique' }, isMain: true },
			{ course: { name: 'Structures de données' }, isMain: false },
		],
	},
	{
		id: '5',
		user: {
			firstName: 'Edem',
			lastName: 'Kponton',
			email: 'e.kponton@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/men/15.jpg',
			sex: 'MALE',
		},
		department: { id: 'dept-2', name: 'Informatique' },
		courses: [{ course: { name: 'Bases de données' }, isMain: true }],
	},
	{
		id: '6',
		user: {
			firstName: 'Yawa',
			lastName: 'Dogbé',
			email: 'y.dogbe@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/women/16.jpg',
			sex: 'FEMALE',
		},
		department: { id: 'dept-2', name: 'Informatique' },
		courses: [{ course: { name: 'Réseaux' }, isMain: true }],
	},
	{
		id: '7',
		user: {
			firstName: 'Sena',
			lastName: 'Agbeko',
			email: 's.agbeko@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/men/17.jpg',
			sex: 'MALE',
		},
		department: { id: 'dept-3', name: 'Physique' },
		courses: [{ course: { name: 'Mécanique Classique' }, isMain: true }],
	},
	{
		id: '8',
		user: {
			firstName: 'Dzidzor',
			lastName: 'Tsikata',
			email: 'd.tsikata@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/women/18.jpg',
			sex: 'FEMALE',
		},
		department: { id: 'dept-3', name: 'Physique' },
		courses: [
			{ course: { name: 'Électromagnétisme' }, isMain: true },
			{ course: { name: 'Optique' }, isMain: false },
		],
	},
	{
		id: '9',
		user: {
			firstName: 'Mawuli',
			lastName: 'Fiagbedzi',
			email: 'm.fiagbedzi@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/men/19.jpg',
			sex: 'MALE',
		},
		department: { id: 'dept-4', name: 'Économie' },
		courses: [{ course: { name: 'Microéconomie' }, isMain: true }],
	},
	{
		id: '10',
		user: {
			firstName: 'Efua',
			lastName: 'Nyarko',
			email: 'e.nyarko@univ.tg',
			avatar_url: 'https://randomuser.me/api/portraits/women/20.jpg',
			sex: 'FEMALE',
		},
		department: { id: 'dept-4', name: 'Économie' },
		courses: [
			{ course: { name: 'Macroéconomie' }, isMain: true },
			{ course: { name: 'Économétrie' }, isMain: false },
		],
	},
];

// ==================== UTILS ====================

function groupByDepartment(teachers: Teacher[]): Department[] {
	const map = new Map<string, Department>();

	for (const teacher of teachers) {
		const dept = teacher.department ?? { id: 'sans-dept', name: 'Sans département' };
		if (!map.has(dept.id)) {
			map.set(dept.id, { id: dept.id, name: dept.name, teachers: [] });
		}
		map.get(dept.id)!.teachers.push(teacher);
	}

	return Array.from(map.values());
}

function getInitials(firstName?: string, lastName?: string) {
	return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

// ==================== TEACHER CARD ====================

function TeacherCard({ teacher, index }: { teacher: Teacher; index: number }) {
	const { user, courses } = teacher;
	const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
	const mainCourse = courses?.find((c) => c.isMain)?.course.name;
	const otherCourses = courses?.filter((c) => !c.isMain).map((c) => c.course.name) ?? [];

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay: 0.08 * index, duration: 0.7 }}
			className="border-foreground/25 relative grid grid-cols-[auto_1fr] gap-x-3 overflow-hidden border border-dashed p-4"
		>
			{/* Background grid decoration */}
			<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
				<div className="from-foreground/5 to-foreground/2 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
					<GridPattern
						width={25}
						height={25}
						x={-12}
						y={4}
						strokeDasharray="3"
						className="stroke-foreground/20 absolute inset-0 h-full w-full mix-blend-overlay"
					/>
				</div>
			</div>

			{/* Avatar */}
			{user.avatar_url ? (
				<img
					alt={fullName}
					src={user.avatar_url}
					loading="lazy"
					className="size-10 rounded-full object-cover"
				/>
			) : (
				<div className="size-10 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold text-foreground/60">
					{getInitials(user.firstName, user.lastName)}
				</div>
			)}

			{/* Info */}
			<div className="min-w-0">
				<div className="-mt-0.5 -space-y-0.5">
					<p className="text-sm md:text-base font-medium truncate">{fullName}</p>
					<span className="text-muted-foreground block text-[11px] font-light tracking-tight truncate">
                        <Link href={`/test/teachers/${teacher.id}`}>
						{user.email}
                        </Link>
					</span>
				</div>

				{/* Courses */}
				{mainCourse && (
					<div className="mt-3 flex flex-wrap gap-1">
						<span className="inline-flex items-center rounded-sm border border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
							{mainCourse}
						</span>
						{otherCourses.slice(0, 2).map((c) => (
							<span
								key={c}
								className="inline-flex items-center rounded-sm border border-foreground/10 px-1.5 py-0.5 text-[10px] font-light text-muted-foreground"
							>
								{c}
							</span>
						))}
					</div>
				)}
			</div>
		</motion.div>
	);
}

// ==================== DEPARTMENT SECTION ====================

const DEPT_COLORS = [
	'from-blue-500/10 to-transparent',
	'from-emerald-500/10 to-transparent',
	'from-violet-500/10 to-transparent',
	'from-amber-500/10 to-transparent',
	'from-rose-500/10 to-transparent',
	'from-cyan-500/10 to-transparent',
];

function DepartmentSection({
	department,
	colorIndex,
}: {
	department: Department;
	colorIndex: number;
}) {
	const [expanded, setExpanded] = useState(true);
	const color = DEPT_COLORS[colorIndex % DEPT_COLORS.length];

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.5, delay: colorIndex * 0.1 }}
			className="space-y-3"
		>
			{/* Department header */}
			<button
				onClick={() => setExpanded((v) => !v)}
				className="group flex w-full items-center gap-3 text-left"
			>
				<div
					className={`relative flex h-8 items-center gap-2 rounded-sm border border-dashed border-foreground/20 bg-gradient-to-r ${color} px-3`}
				>
					<span className="text-xs font-semibold uppercase tracking-widest text-foreground/70">
						{department.name}
					</span>
					<span className="text-[10px] text-muted-foreground">
						({department.teachers.length})
					</span>
				</div>
				<div className="h-px flex-1 border-t border-dashed border-foreground/15" />
				<svg
					className={`size-3.5 text-foreground/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="m18 15-6-6-6 6" />
				</svg>
			</button>

			{/* Teachers grid */}
			<AnimatePresence initial={false}>
				{expanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: 'easeInOut' }}
						className="overflow-hidden"
					>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
							{department.teachers.map((teacher, idx) => (
								<TeacherCard key={teacher.id} teacher={teacher} index={idx} />
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// ==================== MAIN COMPONENT ====================

type TeachersSectionProps = {
	/**
	 * Pass teachers fetched from your API.
	 * Falls back to mock data if not provided.
	 */
	teachers?: Teacher[];
};

export function TeachersSection({ teachers = mockTeachers }: TeachersSectionProps) {
	const departments = groupByDepartment(teachers);
	const totalTeachers = teachers.length;

	return (
		<section className="relative w-full pt-10 pb-20 px-4">
			{/* Background decorations */}
			<div aria-hidden className="absolute inset-0 isolate z-0 contain-strict">
				<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 left-0 h-320 w-140 -translate-y-87.5 -rotate-45 rounded-full" />
				<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 left-0 h-320 w-60 [translate:5%_-50%] -rotate-45 rounded-full" />
			</div>

			<div className="relative mx-auto max-w-5xl space-y-10">
				{/* Header */}
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl xl:text-6xl xl:font-extrabold">
						Notre Corps Enseignant
					</h1>
					<p className="text-muted-foreground text-sm md:text-base lg:text-lg">
						{totalTeachers} enseignant{totalTeachers > 1 ? 's' : ''} répartis dans{' '}
						{departments.length} département{departments.length > 1 ? 's' : ''}.
					</p>
				</div>

				{/* Departments */}
				<div className="space-y-8">
					{departments.map((dept, idx) => (
						<DepartmentSection key={dept.id} department={dept} colorIndex={idx} />
					))}
				</div>
			</div>
		</section>
	);
}

export type { Teacher, Department };