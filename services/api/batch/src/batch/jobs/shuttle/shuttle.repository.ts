import { Injectable } from '@nestjs/common';
import { ShuttleTimetable } from './shuttle.interface';

@Injectable()
export class ShuttleRepository {
  async save(_shuttles: ShuttleTimetable[]): Promise<void> {}
}
