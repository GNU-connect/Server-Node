import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CafeteriaNutritionalIngredientsEntity } from '../entities/cafeteria_nutritional_ingredients.entity';

@Injectable()
export class CafeteriaNutritionalIngredientsRepository {
  constructor(
    @InjectRepository(CafeteriaNutritionalIngredientsEntity)
    private readonly cafeteriaNutritionalIngredientsRepository: Repository<CafeteriaNutritionalIngredientsEntity>, // Inject the repository here
  ) {}

  async findByTime(
    cafeteriaId: number,
    day: string,
    time: string,
  ): Promise<CafeteriaNutritionalIngredientsEntity[]> {
    return await this.cafeteriaNutritionalIngredientsRepository.find({
      select: ['content'],
      where: { cafeteriaId, day, time },
    });
  }
}
