import { Button } from '@/components/ui/button';
import { SearchInput } from '@/shared/form/SearchInput';

type Props = {
  keyword: string;
  selectedCount: number;
  onKeywordChange: (value: string) => void;
  onCreateDialog?: () => void;
  onCreateFullscreen?: () => void;
  onEditSelected?: () => void;
  onDeleteSelected?: () => void;
};

export function MetaSourceTableToolbar({
  keyword,
  selectedCount,
  onKeywordChange,
  onCreateDialog,
  onCreateFullscreen,
  onEditSelected,
  onDeleteSelected,
}: Props) {
  const editEnabled = selectedCount === 1;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
      <SearchInput
        value={keyword}
        onValueChange={onKeywordChange}
        placeholder="Tìm theo code, tên…"
      />

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {selectedCount} đã chọn
          </span>
        )}
        {onEditSelected && (
          <Button
            type="button"
            variant="outline"
            onClick={onEditSelected}
            disabled={!editEnabled}
            title={editEnabled ? 'Sửa dòng đã chọn' : 'Chọn đúng 1 dòng để sửa'}
          >
            Sửa
          </Button>
        )}
        {onDeleteSelected && (
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
          >
            Xoá đã chọn
          </Button>
        )}
        {onCreateDialog && (
          <Button type="button" onClick={onCreateDialog}>
            + Tạo (dialog)
          </Button>
        )}
        {onCreateFullscreen && (
          <Button type="button" variant="outline" onClick={onCreateFullscreen}>
            + Tạo (fullscreen)
          </Button>
        )}
      </div>
    </div>
  );
}
