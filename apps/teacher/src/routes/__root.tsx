import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout, type RouterContext } from "@attendancy/app";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: TeacherRootLayout,
});

function TeacherRootLayout() {
  return (
    <div className="theme-teacher min-h-screen bg-background text-foreground">
      <RootLayout />
    </div>
  );
}
