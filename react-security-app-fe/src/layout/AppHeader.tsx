import { useEffect, useState } from 'react';
import { Moon, RotateCcw, Sun, TableProperties } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <SidebarTrigger
          className="border border-border bg-background hover:bg-muted"
          aria-label="Toggle sidebar"
        />
        <LogoMark />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-foreground">
            TanStack Table Template
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            DataCollection · AppTable · TanStack Form
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => location.reload()}
          title="Reload application"
        >
          <RotateCcw className="h-3.5 w-3.5 sm:mr-1.5" aria-hidden />
          <span className="hidden sm:inline">Reload</span>
        </Button>
        <Avatar size="sm" className="hidden sm:inline-flex">
          <AvatarFallback title="User profile">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Light mode' : 'Dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}

function LogoMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
      <TableProperties className="h-[18px] w-[18px]" aria-hidden />
    </div>
  );
}
