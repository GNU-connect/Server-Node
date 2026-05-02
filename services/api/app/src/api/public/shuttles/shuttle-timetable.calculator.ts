import { Injectable } from '@nestjs/common';
import {
  ShuttleTimetableSectionsResult,
  ShuttleTimetableViewResult,
} from './dtos/results/shuttle-timetable-result.dto';

/** KST(UTC+9) 기준 자정부터의 분 수 */
function getKstMinutes(now: Date): number {
  return (now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % (24 * 60);
}

/** KST 기준 오늘이 금요일인지 여부 */
function isKstFriday(now: Date): boolean {
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

@Injectable()
export class ShuttleTimetableCalculator {
  public calculate(
    timetable: ShuttleTimetableSectionsResult,
    now: Date = new Date(),
  ): ShuttleTimetableViewResult {
    const nowMinutes = getKstMinutes(now);
    const friday = isKstFriday(now);
    const nextRaw = this.findNextRaw(timetable, nowMinutes, friday);

    return {
      nextBus: nextRaw
        ? { time: splitTimeMemo(nextRaw).time, minutesUntil: parseMinutes(nextRaw) - nowMinutes }
        : null,
      sections: Object.entries(timetable).map(([label, times]) => ({
        label,
        times: times.map(raw => {
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
      })),
    };
  }

  private findNextRaw(
    timetable: ShuttleTimetableSectionsResult,
    nowMinutes: number,
    friday: boolean,
  ): string | null {
    for (const times of Object.values(timetable)) {
      for (const raw of times) {
        const { memo } = splitTimeMemo(raw);
        if (friday && memo?.includes('금요일 미운행')) continue;
        if (parseMinutes(raw) >= nowMinutes) return raw;
      }
    }

    return null;
  }
}
