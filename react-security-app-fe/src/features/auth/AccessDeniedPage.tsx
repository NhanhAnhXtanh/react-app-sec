import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <ShieldX className="mx-auto mb-4 h-16 w-16 text-destructive" aria-hidden />
        <h1 className="mb-2 text-3xl font-bold">Access Denied</h1>
        <p className="mb-6 text-muted-foreground">
          You do not have permission to access this page.
        </p>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
