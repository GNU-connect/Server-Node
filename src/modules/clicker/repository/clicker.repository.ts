import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClickerEntity } from '../entities/clicker.entity';

@Injectable()
export class ClickerRepository {
  constructor(
    @InjectRepository(ClickerEntity)
    private readonly clickerRepository: Repository<ClickerEntity>, // Inject the repository here
  ) {}

  async findByCampusId(campusId: number): Promise<ClickerEntity[]> {
    return await this.clickerRepository.find({
      where: {
        campusId: campusId,
      },
    });
  }
}
