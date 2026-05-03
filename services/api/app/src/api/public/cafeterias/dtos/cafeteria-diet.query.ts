import { DietTime } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';

export class CafeteriaDietQuery {
  constructor(
    public readonly cafeteriaId: number,
    public readonly date: Date,
    public readonly time: DietTime,
  ) {}
}
