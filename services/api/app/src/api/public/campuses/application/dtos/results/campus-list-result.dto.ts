export interface CampusItemResult {
  id: number;
  name: string;
  thumbnailUrl: string;
}

export interface CampusListResult {
  campuses: CampusItemResult[];
}
