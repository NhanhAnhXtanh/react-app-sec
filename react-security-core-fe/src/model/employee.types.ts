export type Employee = {
  id: number;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  salary?: number;
  department?: { id: number; name?: string };
};
