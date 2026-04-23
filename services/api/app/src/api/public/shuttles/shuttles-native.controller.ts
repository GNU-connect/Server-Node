import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { JwtAuthGuard } from 'src/api/public/users/guards/jwt-auth.guard';
import { ShuttleRouteResponseDto } from './dtos/responses/shuttle-route-response.dto';
import {
  NextBusDto,
  ShuttleTimetableResponseDto,
  TimeEntryDto,
  TimetableSectionDto,
} from './dtos/responses/shuttle-timetable-response.dto';
import { ShuttlesService } from './shuttles.service';

/** KST(UTC+9) 기준 자정부터의 분 수 */
function getKstMinutes(): number {
  const now = new Date();
  return ((now.getUTCHours() * 60 + now.getUTCMinutes()) + 9 * 60) % (24 * 60);
}

/** KST 기준 오늘이 금요일인지 여부 */
function isKstFriday(): boolean {
  const now = new Date();
  const kstDay = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay();
  return kstDay === 5;
}

/** "HH:mm" 또는 "HH:mm(메모)" 형태에서 분 수 추출 */
function parseMinutes(raw: string): number {
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** "HH:mm(메모)" 형태를 시간/메모로 분리 */
function splitTimeMemo(raw: string): { time: string; memo: string | null } {
  const match = raw.match(/^(\d{1,2}:\d{2})\((.+)\)$/);
  if (match) return { time: match[1], memo: match[2] };
  return { time: raw, memo: null };
}

function formatUpdatedAt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

@ApiTags('shuttles')
@Controller('shuttles')
@UseGuards(JwtAuthGuard)
export class ShuttlesNativeController {
  constructor(private readonly shuttlesService: ShuttlesService) {}

  @Get('routes')
  @ApiOkResponse({ type: NativeResponseDto<ShuttleRouteResponseDto[]> })
  async getRoutes(): Promise<NativeResponseDto<ShuttleRouteResponseDto[]>> {
    const routes = await this.shuttlesService.getRoutes();
    const data: ShuttleRouteResponseDto[] = routes.map((r) => ({
      routeName: r.routeName,
      updatedAt: r.updatedAt.toISOString(),
    }));
    return new NativeResponseDto(data);
  }

  @Get(':routeName/timetable')
  @ApiOkResponse({ type: NativeResponseDto<ShuttleTimetableResponseDto> })
  async getTimetable(
    @Param('routeName') routeName: string,
  ): Promise<NativeResponseDto<ShuttleTimetableResponseDto>> {
    const record = await this.shuttlesService.getTimetable(routeName);
    const rawTimetable = record.timetable as Record<string, string[]>;

    const nowMinutes = getKstMinutes();
    const friday = isKstFriday();

    // 다음 버스 탐색: 금요일 미운행 항목은 오늘 금요일이면 제외
    let nextRaw: string | null = null;
    for (const times of Object.values(rawTimetable)) {
      for (const raw of times) {
        const { memo } = splitTimeMemo(raw);
        if (friday && memo?.includes('금요일 미운행')) continue;
        if (parseMinutes(raw) >= nowMinutes) {
          nextRaw = raw;
          break;
        }
      }
      if (nextRaw) break;
    }

    const nextBus: NextBusDto | null = nextRaw
      ? { time: splitTimeMemo(nextRaw).time, minutesUntil: parseMinutes(nextRaw) - nowMinutes }
      : null;

    const sections: TimetableSectionDto[] = Object.entries(rawTimetable).map(
      ([label, times]) => ({
        label,
        times: times.map((raw): TimeEntryDto => {
          const { time, memo } = splitTimeMemo(raw);
          const minutes = parseMinutes(raw);
          const isNext = raw === nextRaw;
          let status: 'past' | 'next' | 'future';
          if (isNext) {
            status = 'next';
          } else {
            status = minutes < nowMinutes ? 'past' : 'future';
          }
          return { time, memo, status };
        }),
      }),
    );

    const data: ShuttleTimetableResponseDto = {
      routeName: record.routeName,
      nextBus,
      sections,
      updatedAt: formatUpdatedAt(record.updatedAt),
    };

    return new NativeResponseDto(data);
  }
}
