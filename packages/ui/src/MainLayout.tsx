import type { ReactNode } from "react";

export function MainLayout({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      {header}
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
