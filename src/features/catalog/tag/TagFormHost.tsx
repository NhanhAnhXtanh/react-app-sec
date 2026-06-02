import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { Tag } from '@/model/catalog.types';
import {
  TagEditForm,
  type TagFormValues,
} from './edit/TagEditForm';
import { TagDetailView } from './detail/TagDetailView';

export type { TagFormValues };

export type TagFormHostProps = {
  state: EntityFormState<Tag>;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: TagFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<Tag>['mode'], string> = {
  create: 'Tạo Tag',
  edit: 'Sửa Tag',
  view: 'Chi tiết Tag',
};

export function TagFormHost({
  state,
  onClose,
  onEdit,
  onSubmit,
  submitting,
}: TagFormHostProps) {
  const subtitle =
    state.mode !== 'create' && state.item ? state.item.name : undefined;

  return (
    <FormShell
      open={state.open}
      presentation={state.presentation}
      title={TITLES[state.mode]}
      subtitle={subtitle}
      onClose={onClose}
      dialogClassName={state.mode === 'view' ? VIEW_DIALOG_CLASS_NAME : undefined}
    >
      {state.mode === 'view' && state.item ? (
        <TagDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
        />
      ) : (
        <TagEditForm
          key={`${state.mode}:${state.item?.id ?? 'new'}:${state.presentation}`}
          mode={state.mode === 'edit' ? 'edit' : 'create'}
          item={state.item}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      )}
    </FormShell>
  );
}
