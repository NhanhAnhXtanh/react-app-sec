import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ActivatePage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!key) {
      setStatus('error');
      return;
    }
    authApi
      .activate(key)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [key]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm text-center shadow-lg">
        <CardContent className="pt-8 pb-8">
          {status === 'loading' && (
            <p className="text-muted-foreground">Activating account…</p>
          )}
          {status === 'success' && (
            <>
              <div className="mb-4 text-4xl">✅</div>
              <h2 className="mb-2 text-xl font-semibold">Account activated!</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Your account has been activated successfully.
              </p>
              <Button asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mb-4 text-4xl">❌</div>
              <h2 className="mb-2 text-xl font-semibold">Activation failed</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                The activation key is invalid or has expired.
              </p>
              <Button variant="outline" asChild>
                <Link to="/login">Back to sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
