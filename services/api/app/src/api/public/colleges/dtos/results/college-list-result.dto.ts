export interface CollegeItemResult {
  id: number;
  name: string;
  thumbnailUrl: string;
}

export interface CollegeListResult {
  colleges: CollegeItemResult[];
  total: number;
}
