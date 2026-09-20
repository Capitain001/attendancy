"use client";
import React, { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface iNavItem {
	heading: string;
	href: string;
}

interface iNavLinkProps extends iNavItem {
	setIsActive: (isActive: boolean) => void;
	index: number;
}

interface iCurvedNavbarProps {
	setIsActive: (isActive: boolean) => void;
	navItems: iNavItem[];
}

interface iMobileNavMenuProps {
	navItems: iNavItem[];
}

const MENU_SLIDE_ANIMATION = {
	initial: { x: "calc(100% + 100px)" },
	enter: {
		x: "0",
		transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const },
	},
	exit: {
		x: "calc(100% + 100px)",
		transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const },
	},
};

const NavLink: React.FC<iNavLinkProps> = ({
	heading,
	href,
	setIsActive,
	index,
}) => {
	return (
		<div
			onClick={() => setIsActive(false)}
			className="group relative flex items-center border-b border-black/15 py-2.5 sm:py-3 uppercase hover:opacity-70 transition-opacity"
		>
			<Link href={href} className="flex items-center w-full">
				<span className="text-black/40 text-xs sm:text-sm font-medium mr-3 font-mono">
					{index < 10 ? `0${index}` : index}.
				</span>
				<span className="text-base sm:text-lg font-normal text-black tracking-wider">
					{heading}
				</span>
			</Link>
		</div>
	);
};

const Curve: React.FC = () => {
	const [height, setHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

	React.useEffect(() => {
		setHeight(window.innerHeight);
		const handleResize = () => setHeight(window.innerHeight);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const initialPath = `M100 0 L200 0 L200 ${height} L100 ${height} Q-100 ${height / 2} 100 0`;
	const targetPath = `M100 0 L200 0 L200 ${height} L100 ${height} Q100 ${height / 2} 100 0`;

	const curve = {
		initial: { d: initialPath },
		enter: {
			d: targetPath,
			transition: { duration: 1, ease: [0.76, 0, 0.24, 1] as const },
		},
		exit: {
			d: initialPath,
			transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as const },
		},
	};

	return (
		<svg
			className="absolute top-0 -left-[99px] w-[100px] stroke-none h-full"
			style={{ fill: "#ffffff" }}
		>
			<motion.path
				variants={curve}
				initial="initial"
				animate="enter"
				exit="exit"
			/>
		</svg>
	);
};

const CurvedNavbar: React.FC<iCurvedNavbarProps> = ({
	setIsActive,
	navItems,
}) => {
	return (
		<motion.div
			variants={MENU_SLIDE_ANIMATION}
			initial="initial"
			animate="enter"
			exit="exit"
			className="h-[100dvh] w-screen max-w-screen-sm fixed right-0 top-0 z-40 bg-white"
		>
			<div className="h-full pt-8 pb-8 flex flex-col justify-between overflow-y-auto">
				<div className="flex flex-col gap-3 px-8 md:px-16">
					<div className="text-black/60 border-b border-black/15 uppercase text-xs tracking-wider pb-2">
						<p>Navigation</p>
					</div>
					<section className="bg-transparent">
						<div className="mx-auto max-w-7xl">
							{navItems.map((item, index) => (
								<NavLink
									key={item.href}
									{...item}
									setIsActive={setIsActive}
									index={index + 1}
								/>
							))}
						</div>
					</section>
				</div>
			</div>
			<Curve />
		</motion.div>
	);
};

const MobileNavMenu: React.FC<iMobileNavMenuProps> = ({ navItems }) => {
	const [isActive, setIsActive] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsActive(!isActive)}
				aria-label={isActive ? "Fermer le menu" : "Ouvrir le menu"}
				aria-expanded={isActive}
				className="fixed right-0 top-[20%] -translate-y-1/2 z-50 flex size-6 items-center justify-center rounded-l-2xl border border-r-0 border-black/20 bg-white shadow-md"
			>
				<ChevronLeft
					className={`h-5 w-5 text-black transition-transform duration-500 ${
						isActive ? "rotate-180" : ""
					}`}
				/>
			</button>

			<AnimatePresence mode="wait">
				{isActive && (
					<CurvedNavbar setIsActive={setIsActive} navItems={navItems} />
				)}
			</AnimatePresence>
		</>
	);
};

export default MobileNavMenu;