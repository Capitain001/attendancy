import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@attendancy/auth";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

type NavItem = {
  heading: string;
  to: "/home" | "/sessions";
};

const navItems: NavItem[] = [
  { heading: "Accueil", to: "/home" },
  { heading: "Séances", to: "/sessions" },
];

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="theme-teacher flex min-h-screen flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <MobileNavMenu navItems={navItems} />
    </div>
  );
}

function MobileNavMenu({ navItems }: { navItems: NavItem[] }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsActive((value) => !value)}
        aria-label={isActive ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={isActive}
        className="fixed right-0 top-[20%] z-50 flex size-8 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-slate-200 bg-white/95 text-slate-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-50"
      >
        <ChevronLeft
          className={`h-5 w-5 transition-transform duration-500 ${
            isActive ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            initial={{ x: "calc(100% + 100px)" }}
            animate={{ x: 0, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
            exit={{ x: "calc(100% + 100px)", transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
            className="fixed right-0 top-0 z-40 h-100dvh w-[min(22rem,85vw)] bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col justify-between overflow-y-auto pb-8 pt-9">
              <div className="flex flex-col gap-3 px-8">
                <div className="border-b border-slate-200 pb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
                  Navigation
                </div>

                <div className="space-y-2 pt-3">
                  {navItems.map((item, index) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsActive(false)}
                      className="group flex items-center border-b border-slate-200 py-3 transition-opacity hover:opacity-70"
                    >
                      <span className="mr-3 font-mono text-xs font-medium text-slate-400">
                        {index < 9 ? `0${index + 1}` : index + 1}.
                      </span>
                      <span className="text-base font-medium tracking-[0.1em] text-slate-800 uppercase">
                        {item.heading}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
