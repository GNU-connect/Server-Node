import { Injectable, NotFoundException } from '@nestjs/common';
import { ShuttleTimetable } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.entity';
import { ShuttleTimetableRepository } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.repository';

@Injectable()
export class ShuttlesService {
  constructor(
    private readonly shuttleTimetableRepository: ShuttleTimetableRepository,
  ) {}

  public getRoutes(): Promise<ShuttleTimetable[]> {
    return this.shuttleTimetableRepository.findAll();
  }

  public async getTimetable(routeName: string): Promise<ShuttleTimetable> {
    const record = await this.shuttleTimetableRepository.findByRouteName(routeName);

    if (!record) {
      throw new NotFoundException(`'${routeName}' 노선의 시간표를 찾을 수 없습니다.`);
    }

    return record;
  }
}
