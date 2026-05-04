import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsISO8601 } from 'class-validator';
import { MealType } from '../../../domain/enum/meal-type.enum';

export class GetMealScheduleQueryDto {
  @IsDefined({ message: 'date는 필수입니다.' })
  @IsISO8601({ strict: true }, { message: 'date는 유효한 날짜여야 합니다.' })
  @ApiProperty({
    description: '날짜 (YYYY-MM-DD).',
    example: '2026-04-21',
  })
  date: string;

  @IsDefined({ message: 'mealType은 필수입니다.' })
  @IsEnum(MealType)
  @ApiProperty({
    description: '끼니 타입.',
    enum: MealType,
    example: '점심',
  })
  mealType: MealType;
}
