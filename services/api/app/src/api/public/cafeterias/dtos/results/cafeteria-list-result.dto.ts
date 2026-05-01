import { CampusItemResult } from 'src/api/public/campuses/dtos/results/campus-list-result.dto';

export interface CafeteriaItemResult {
  id: number;
  name: string;
  thumbnailUrl: string;
  campus: CampusItemResult;
}

export interface CafeteriaListResult {
  cafeterias: CafeteriaItemResult[];
}
