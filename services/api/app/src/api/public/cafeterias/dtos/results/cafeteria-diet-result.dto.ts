import { DietTime } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';

export interface CafeteriaDietResult {
  cafeteria: Cafeteria;
  diets: CafeteriaDiet[];
  date: Date;
  time: DietTime;
}
