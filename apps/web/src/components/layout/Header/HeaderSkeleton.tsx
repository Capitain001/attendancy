export function HeaderSkeleton() {
  return (
    <header className="z-50 flex h-14 w-full items-center border-b border-border/20 bg-background/80 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between px-4">
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="size-9 animate-pulse rounded-full bg-muted" />
      </div>
    </header>
  );
}
