import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { MetaSource } from '@/model/metasource.types';
import {
  MetaSourceEditForm,
  type MetaSourceFormValues,
} from './edit/MetaSourceEditForm';
import { MetaSourceDetailView } from './detail/MetaSourceDetailView';

export type { MetaSourceFormValues };

export type MetaSourceFormHostProps = {
  state: EntityFormState<MetaSource>;
  onClose: () => void;
  onEdit?: () => void;
  onConnect?: () => void;
  onSubmit: (values: MetaSourceFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<MetaSource>['mode'], string> = {
  create: 'Tạo MetaSource',
  edit: 'Sửa MetaSource',
  view: 'Chi tiết MetaSource',
};

export function MetaSourceFormHost({
  state,
  onClose,
  onEdit,
  onSubmit,
  onConnect,
  submitting,
}: MetaSourceFormHostProps) {
  const subtitle =
    state.mode !== 'create' && state.item
      ? `${state.item.code} · ${state.item.name}`
      : undefined;

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
        <MetaSourceDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
          onConnect={onConnect}
        />
      ) : (
        <MetaSourceEditForm
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
