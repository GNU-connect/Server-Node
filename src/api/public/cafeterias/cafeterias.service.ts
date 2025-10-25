import { Injectable } from '@nestjs/common';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';

@Injectable()
export class CafeteriasService {
  constructor(private readonly cafeteriasRepository: CafeteriasRepository) {}

  public async getCafeterias(campusId: number): Promise<Cafeteria[]> {
    return this.cafeteriasRepository.findByCampusId(campusId);
  }
}
