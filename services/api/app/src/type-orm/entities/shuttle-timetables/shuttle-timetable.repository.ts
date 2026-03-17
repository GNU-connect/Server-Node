import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShuttleTimetable } from './shuttle-timetable.entity';

@Injectable()
export class ShuttleTimetableRepository {
  constructor(
    @InjectRepository(ShuttleTimetable)
    private readonly shuttleTimetableRepository: Repository<ShuttleTimetable>,
  ) {}

  findAll(): Promise<ShuttleTimetable[]> {
    return this.shuttleTimetableRepository.find();
  }

  findByRouteName(routeName: string): Promise<ShuttleTimetable | null> {
    return this.shuttleTimetableRepository.findOne({
      where: { routeName },
    });
  }
}
