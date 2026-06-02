import type { Table } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type Props<T> = {
  table: Table<T>;
  rows?: number;
};

export function TableLoadingSkeleton<T>({
  table,
  rows = 6,
}: Props<T>) {
  const colCount = table.getAllLeafColumns().length;

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={`loading-${rowIdx}`} aria-hidden>
          {Array.from({ length: colCount }).map((__, colIdx) => (
            <TableCell key={`loading-${rowIdx}-${colIdx}`}>
              <Skeleton
                className={cn(
                  'h-4 w-full max-w-[14rem]',
                  colIdx === 0 && 'max-w-8',
                  colIdx === colCount - 1 && 'ml-auto max-w-20',
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
