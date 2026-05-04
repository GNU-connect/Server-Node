import { ApiProperty } from '@nestjs/swagger';
import { DateMealSelectionPolicy } from '../domain/date-meal-selection-policy.domain';
import { MealSchedule } from '../domain/meal-schedule.domain';
import { MealType } from '../domain/enum/meal-type.enum';
import { MenuGroupResponseDto } from './menu-group-response.dto';
import { RestaurantResponseDto } from './restaurant-response.dto';

export class MealScheduleResponseDto {
  @ApiProperty({ description: '식당 정보', type: RestaurantResponseDto })
  restaurant: RestaurantResponseDto;

  @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2026-04-21' })
  date: string;

  @ApiProperty({ description: '끼니 타입', enum: MealType, example: '점심' })
  mealType: MealType;

  @ApiProperty({ description: '카테고리별 메뉴 목록', type: [MenuGroupResponseDto] })
  menuGroups: MenuGroupResponseDto[];

  @ApiProperty({ description: '메뉴 존재 여부' })
  hasMenu: boolean;

  static from(schedule: MealSchedule): MealScheduleResponseDto {
    return {
      restaurant: RestaurantResponseDto.from(schedule.restaurant),
      date: DateMealSelectionPolicy.formatDate(schedule.date),
      mealType: schedule.mealType,
      menuGroups: schedule.menuGroups.map(group => MenuGroupResponseDto.from(group)),
      hasMenu: schedule.hasMenu(),
    };
  }
}
