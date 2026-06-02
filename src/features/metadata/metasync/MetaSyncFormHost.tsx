import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { MetaSync } from '@/model/metasync.types';
import {
  MetaSyncEditForm,
  type MetaSyncFormValues,
} from './edit/MetaSyncEditForm';
import { MetaSyncDetailView } from './detail/MetaSyncDetailView';

export type { MetaSyncFormValues };

export type MetaSyncFormHostProps = {
  state: EntityFormState<MetaSync>;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: MetaSyncFormValues) => void | Promise<void>;
  submitting?: boolean;
  onExtracted?: (metaSetId: string) => void;
};

const TITLES: Record<EntityFormState<MetaSync>['mode'], string> = {
  create: 'Tạo MetaSync',
  edit: 'Sửa MetaSync',
  view: 'Chi tiết MetaSync',
};

export function MetaSyncFormHost({
  state,
  onClose,
  onEdit,
  onSubmit,
  submitting,
  onExtracted,
}: MetaSyncFormHostProps) {
  const subtitle =
    state.mode !== 'create' && state.item
      ? `${state.item.code}${state.item.metaName ? ` · ${state.item.metaName}` : ''}`
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
        <MetaSyncDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
          onExtracted={onExtracted}
        />
      ) : (
        <MetaSyncEditForm
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
