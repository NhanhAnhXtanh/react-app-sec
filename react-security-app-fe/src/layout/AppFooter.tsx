export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background/95 px-6 py-3 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span>© {year} TanStack Table Template</span>
        <span className="text-right">
          React 18 · TanStack Query · TanStack Table · TanStack Form · React
          Router
        </span>
      </div>
    </footer>
  );
}
