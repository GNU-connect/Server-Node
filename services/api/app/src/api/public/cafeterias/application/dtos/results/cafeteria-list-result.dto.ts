import { CampusItemResult } from 'src/api/public/campuses/application/dtos/results/campus-list-result.dto';

export interface CafeteriaItemResult {
  id: number;
  name: string;
  thumbnailUrl: string;
  campus: CampusItemResult;
}

export interface CafeteriaListResult {
  cafeterias: CafeteriaItemResult[];
}
