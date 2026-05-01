import { ShuttleTimetable } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.entity';

export interface ShuttleRouteListResult {
  routes: ShuttleTimetable[];
}
