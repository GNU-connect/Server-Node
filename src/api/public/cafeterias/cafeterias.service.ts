import { Injectable } from '@nestjs/common';
import { DietTime } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';

@Injectable()
export class CafeteriasService {
  constructor(private readonly cafeteriasRepository: CafeteriasRepository) {}

  public async getCafeterias(campusId: number): Promise<Cafeteria[]> {
    return this.cafeteriasRepository.findCafeteriasByCampusId(campusId);
  }

  public async getCafeteria(cafeteriaId: number): Promise<Cafeteria> {
    return this.cafeteriasRepository.findCafeteriaById(cafeteriaId);
  }

  public async getCafeteriaDiets(
    cafeteriaId: number,
    date: Date,
    time: DietTime,
  ): Promise<CafeteriaDiet[]> {
    return this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
      cafeteriaId,
      date,
      time,
    );
  }
}
