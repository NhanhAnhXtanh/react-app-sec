import type { FormPresentation } from '@/shared/types/form.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const VIEW_DIALOG_CLASS_NAME =
  'w-[calc(100vw-2rem)] sm:max-w-[min(1400px,calc(100vw-2rem))]';

type Props = {
  open: boolean;
  presentation: FormPresentation;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  dialogClassName?: string;
};

export function FormShell({
  open,
  presentation,
  title,
  subtitle,
  onClose,
  children,
  dialogClassName,
}: Props) {
  if (!open) return null;

  const dialogWidthClassName = dialogClassName ?? 'sm:max-w-xl';

  if (presentation === 'fullscreen') {
    return (
      <Card className="flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-lg shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            {subtitle ? (
              <CardDescription>{subtitle}</CardDescription>
            ) : null}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-auto pt-6">
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className={`max-h-[min(90dvh,calc(100%-2rem))] gap-0 overflow-y-auto p-0 ${dialogWidthClassName}`}
      >
        <DialogHeader className="border-b px-5 py-4 text-left sm:text-left">
          <DialogTitle>{title}</DialogTitle>
          {subtitle ? (
            <DialogDescription>{subtitle}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="px-5 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
