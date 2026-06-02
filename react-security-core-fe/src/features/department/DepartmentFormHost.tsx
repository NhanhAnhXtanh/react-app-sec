import { FormShell } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { Department } from '@/model/department.types';
import {
  DepartmentEditForm,
  type DepartmentFormValues,
} from './edit/DepartmentEditForm';
import { DepartmentDetailView } from './detail/DepartmentDetailView';

export type { DepartmentFormValues };

export type DepartmentFormHostProps = {
  state: EntityFormState<Department>;
  defaultOrganizationId?: string;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: DepartmentFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<Department>['mode'], string> = {
  create: 'Create department',
  edit: 'Edit department',
  view: 'Department details',
};

export function DepartmentFormHost({
  state,
  defaultOrganizationId,
  onClose,
  onEdit,
  onSubmit,
  submitting,
}: DepartmentFormHostProps) {
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
    >
      {state.mode === 'view' && state.item ? (
        <DepartmentDetailView
          key={`view:${state.item.id}:${state.presentation}`}
          item={state.item}
          onClose={onClose}
          onEdit={onEdit}
        />
      ) : (
        <DepartmentEditForm
          key={`${state.mode}:${state.item?.id ?? 'new'}:${state.presentation}:${defaultOrganizationId ?? ''}`}
          mode={state.mode === 'edit' ? 'edit' : 'create'}
          item={state.item}
          defaultOrganizationId={defaultOrganizationId}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      )}
    </FormShell>
  );
}
