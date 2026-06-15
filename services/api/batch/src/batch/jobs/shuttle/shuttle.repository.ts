import { Injectable } from '@nestjs/common';
import { ShuttleTimetable } from './domain/shuttle-timetable.entity';

@Injectable()
export class ShuttleRepository {
  async save(_shuttles: ShuttleTimetable[]): Promise<void> {}
}
