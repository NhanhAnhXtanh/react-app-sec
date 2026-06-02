import { FormShell, VIEW_DIALOG_CLASS_NAME } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { Organization } from '@/model/catalog.types';
import {
  OrganizationEditForm,
  type OrganizationFormValues,
} from './edit/OrganizationEditForm';
import { OrganizationDetailView } from './detail/OrganizationDetailView';

export type { OrganizationFormValues };

export type OrganizationFormHostProps = {
  state: EntityFormState<Organization>;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: OrganizationFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<Organization>['mode'], string> = {
  create: 'Tạo Organization',
  edit: 'Sửa Organization',
  view: 'Chi tiết Organization',
};

export function OrganizationFormHost({
  state,
  onClose,
  onEdit,
  onSubmit,
  submitting,
}: OrganizationFormHostProps) {
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
        <OrganizationDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
        />
      ) : (
        <OrganizationEditForm
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
