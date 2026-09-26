import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShuttleTimetable } from './domain/shuttle-timetable.entity';

export type ShuttleTimetableUpsert = Omit<ShuttleTimetable, 'id'>;

@Injectable()
export class ShuttleRepository {
  constructor(
    @InjectRepository(ShuttleTimetable)
    private readonly repository: Repository<ShuttleTimetable>,
  ) {}

  async save(shuttles: ShuttleTimetableUpsert[]): Promise<void> {
    await this.repository.upsert(shuttles, ['routeName']);
  }
}
