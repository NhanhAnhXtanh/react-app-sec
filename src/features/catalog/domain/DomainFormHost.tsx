import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { Domain } from '@/model/catalog.types';
import {
  DomainEditForm,
  type DomainFormValues,
} from './edit/DomainEditForm';
import { DomainDetailView } from './detail/DomainDetailView';

export type { DomainFormValues };

export type DomainFormHostProps = {
  state: EntityFormState<Domain>;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: DomainFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<Domain>['mode'], string> = {
  create: 'Tạo Domain',
  edit: 'Sửa Domain',
  view: 'Chi tiết Domain',
};

export function DomainFormHost({
  state,
  onClose,
  onEdit,
  onSubmit,
  submitting,
}: DomainFormHostProps) {
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
        <DomainDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
        />
      ) : (
        <DomainEditForm
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
