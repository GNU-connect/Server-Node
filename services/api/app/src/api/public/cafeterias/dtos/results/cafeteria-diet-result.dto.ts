import { DietTime } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { CafeteriaItemResult } from 'src/api/public/cafeterias/dtos/results/cafeteria-list-result.dto';

export interface CafeteriaDietItemResult {
  dishCategory: string | null;
  dishType: string | null;
  dishName: string;
}

export interface CafeteriaMenuGroupResult {
  category: string;
  items: string[];
}

export interface CafeteriaDietResult {
  cafeteria: CafeteriaItemResult;
  menuGroups: CafeteriaMenuGroupResult[];
  date: Date;
  time: DietTime;
}
