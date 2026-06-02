export type Department = {
  id: number;
  code: string;
  name: string;
  costCenter?: string;
  organization?: {
    id: number;
    name: string;
    code?: string;
    ownerLogin?: string;
  };
};
