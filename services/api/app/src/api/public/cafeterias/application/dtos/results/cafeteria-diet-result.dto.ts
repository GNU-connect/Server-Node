import { DietTime } from 'src/api/public/cafeterias/application/utils/time';
import { CafeteriaItemResult } from 'src/api/public/cafeterias/application/dtos/results/cafeteria-list-result.dto';

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
