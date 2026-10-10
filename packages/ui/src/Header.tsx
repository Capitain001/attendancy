type HeaderProps = {
  user?: { email?: string | null };
  onSignOut?: () => void;
};

export function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      <span className="font-semibold">Attendancy</span>
      {user && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{user.email}</span>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              Déconnexion
            </button>
          )}
        </div>
      )}
    </header>
  );
}
