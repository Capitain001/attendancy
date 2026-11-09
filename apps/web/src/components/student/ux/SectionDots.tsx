// src/components/student/ux/SectionDots.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  sections: readonly { id: string; label: string }[];
  scrollerId: string;
}

export function SectionDots({ sections, scrollerId }: Props) {
  const [active, setActive] = useState(sections[0]?.id);
  const key = sections.map((s) => s.id).join(",");

  useEffect(() => {
    const root = document.getElementById(scrollerId);
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { root, threshold: 0.6 },
    );

    for (const id of key.split(",")) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key, scrollerId]);

  return (
    <nav aria-label="Sections" className="fixed top-1/2 right-3 z-10 -translate-y-1/2">
      <ul className="flex flex-col gap-1">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              aria-label={s.label}
              aria-current={active === s.id}
              onClick={() =>
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="flex size-5 items-center justify-center"
            >
              <span
                className={cn(
                  "block rounded-full bg-foreground transition-all",
                  active === s.id ? "size-2 opacity-100" : "size-1.5 opacity-25",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}