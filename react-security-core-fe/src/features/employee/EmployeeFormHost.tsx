import { FormShell } from '@/shared/form/FormShell';
import type { EntityFormState } from '@/shared/types/form.types';
import type { Employee } from '@/model/employee.types';
import { EmployeeEditForm, type EmployeeFormValues } from './edit/EmployeeEditForm';
import { EmployeeDetailView } from './detail/EmployeeDetailView';

export type { EmployeeFormValues };

export type EmployeeFormHostProps = {
  state: EntityFormState<Employee>;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
  submitting?: boolean;
};

const TITLES: Record<EntityFormState<Employee>['mode'], string> = {
  create: 'Create employee',
  edit: 'Edit employee',
  view: 'Employee details',
};

export function EmployeeFormHost({ state, onClose, onEdit, onSubmit, submitting }: EmployeeFormHostProps) {
  const subtitle =
    state.mode !== 'create' && state.item
      ? [state.item.firstName, state.item.lastName].filter(Boolean).join(' ') || `#${state.item.id}`
      : undefined;

  return (
    <FormShell open={state.open} presentation={state.presentation} title={TITLES[state.mode]} subtitle={subtitle} onClose={onClose}>
      {state.mode === 'view' && state.item ? (
        <EmployeeDetailView key={`view:${state.item.id}:${state.presentation}`} item={state.item} onClose={onClose} onEdit={onEdit} />
      ) : (
        <EmployeeEditForm
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
