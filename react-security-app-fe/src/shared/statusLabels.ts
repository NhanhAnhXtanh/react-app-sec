export type AppStatus = 'ACTIVE' | 'INACTIVE';

export const statusLabels: Record<AppStatus, string> = {
  ACTIVE: 'Hoạt động (Active)',
  INACTIVE: 'Không hoạt động (Inactive)',
};

export function getStatusLabel(status: AppStatus): string {
  return statusLabels[status] ?? status;
}
