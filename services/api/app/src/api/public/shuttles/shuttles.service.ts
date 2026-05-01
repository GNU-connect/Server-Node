import { Injectable, NotFoundException } from '@nestjs/common';
import { ShuttleRouteListResult } from 'src/api/public/shuttles/dtos/results/shuttle-route-list-result.dto';
import { ShuttleTimetableResult } from 'src/api/public/shuttles/dtos/results/shuttle-timetable-result.dto';
import { ShuttleTimetableRepository } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.repository';

@Injectable()
export class ShuttlesService {
  constructor(
    private readonly shuttleTimetableRepository: ShuttleTimetableRepository,
  ) {}

  public async getRoutes(): Promise<ShuttleRouteListResult> {
    const routes = await this.shuttleTimetableRepository.findAll();
    return { routes };
  }

  public async getTimetable(routeName: string): Promise<ShuttleTimetableResult> {
    const record = await this.shuttleTimetableRepository.findByRouteName(routeName);

    if (!record) {
      throw new NotFoundException(`'${routeName}' 노선의 시간표를 찾을 수 없습니다.`);
    }

    return { timetable: record };
  }
}
