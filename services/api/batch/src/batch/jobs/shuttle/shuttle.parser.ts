import { Injectable } from '@nestjs/common';
import { ShuttleTimetable } from './shuttle.interface';

@Injectable()
export class ShuttleParser {
  parse(_raw: string): ShuttleTimetable[] {
    return [];
  }
}
