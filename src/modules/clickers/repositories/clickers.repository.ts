import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clicker } from '../entities/clickers.entity';

@Injectable()
export class ClickersRepository {
  constructor(
    @InjectRepository(Clicker)
    private readonly clickerRepository: Repository<Clicker>,
  ) {}

  async findByCampusId(campusId: number): Promise<Clicker[]> {
    return await this.clickerRepository.find({
      where: {
        campusId: campusId,
        isActive: true,
      },
    });
  }
}
