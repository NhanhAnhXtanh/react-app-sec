import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function NotFound() {
  return (
    <Card className="mx-auto max-w-md text-center shadow-sm">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>
          The route you tried doesn&apos;t exist.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <Button asChild>
          <Link to="/companies">Back to Companies</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
