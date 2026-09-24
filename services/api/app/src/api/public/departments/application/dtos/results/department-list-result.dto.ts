export interface DepartmentItemResult {
  id: number;
  name: string;
}

export interface DepartmentListResult {
  departments: DepartmentItemResult[];
  total: number;
}
