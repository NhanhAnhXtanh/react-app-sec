import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { MetaSet } from '@/model/metaset.types';
import {
  MetaSetEditForm,
  type MetaSetFormValues,
} from './edit/MetaSetEditForm';
import { MetaSetDetailView } from './detail/MetaSetDetailView';
import type { MetaSetActionKind } from './detail/MetaSetActionDialog';

export type { MetaSetFormValues };

export type MetaSetFormHostProps = {
  state: EntityFormState<MetaSet>;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: MetaSetFormValues) => void | Promise<void>;
  onAction?: (
    kind: MetaSetActionKind,
    payload: { actor?: string; comment?: string },
  ) => Promise<void> | void;
  actionPending?: boolean;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<MetaSet>['mode'], string> = {
  create: 'Tạo MetaSet',
  edit: 'Sửa MetaSet',
  view: 'Chi tiết MetaSet',
};

export function MetaSetFormHost({
  state,
  onClose,
  onEdit,
  onSubmit,
  onAction,
  actionPending,
  submitting,
}: MetaSetFormHostProps) {
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
      dialogClassName={VIEW_DIALOG_CLASS_NAME}
    >
      {state.mode === 'view' && state.item ? (
        <MetaSetDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
          onAction={onAction}
          actionPending={actionPending}
        />
      ) : (
        <MetaSetEditForm
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
