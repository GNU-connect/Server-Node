import { Injectable } from '@nestjs/common';
import { ChannelType } from './enum/channel-type.enum';
import { MealType } from './enum/meal-type.enum';

type DateInput = '오늘' | '내일' | string | undefined;
type MealTypeInput = MealType | string | undefined;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

@Injectable()
export class DateMealSelectionPolicy {
  resolveDate(now: Date, channel: ChannelType, input?: DateInput): Date {
    if (input && this.isIsoDate(input)) {
      return new Date(`${input}T00:00:00.000Z`);
    }

    if (input === '오늘') {
      return this.toKstDateOnly(now);
    }

    if (input === '내일') {
      return this.addDays(this.toKstDateOnly(now), 1);
    }

    if (channel === ChannelType.CHATBOT && this.shouldUseTomorrow(now)) {
      return this.addDays(this.toKstDateOnly(now), 1);
    }

    return this.toKstDateOnly(now);
  }

  resolveMealType(now: Date, input?: MealTypeInput): MealType {
    if (input && Object.values(MealType).includes(input as MealType)) {
      return input as MealType;
    }

    const { hours, minutes } = this.getSeoulHoursMinutes(now);
    const totalMinutes = hours * 60 + minutes;
    const breakfastStart = 19 * 60;
    const breakfastEnd = 9 * 60 + 30;
    const lunchEnd = 13 * 60 + 30;

    if (totalMinutes >= breakfastStart || totalMinutes < breakfastEnd) {
      return MealType.BREAKFAST;
    }
    if (totalMinutes < lunchEnd) {
      return MealType.LUNCH;
    }
    return MealType.DINNER;
  }

  static formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private shouldUseTomorrow(now: Date): boolean {
    const { hours } = this.getSeoulHoursMinutes(now);
    return hours >= 19;
  }

  private toKstDateOnly(date: Date): Date {
    const seoul = new Date(date.getTime() + KST_OFFSET_MS);
    const year = seoul.getUTCFullYear();
    const month = String(seoul.getUTCMonth() + 1).padStart(2, '0');
    const day = String(seoul.getUTCDate()).padStart(2, '0');
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private getSeoulHoursMinutes(date: Date): { hours: number; minutes: number } {
    const seoul = new Date(date.getTime() + KST_OFFSET_MS);
    return {
      hours: seoul.getUTCHours(),
      minutes: seoul.getUTCMinutes(),
    };
  }

  private isIsoDate(input: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(input);
  }
}
