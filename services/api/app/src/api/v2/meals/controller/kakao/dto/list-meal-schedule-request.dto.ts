import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsIn, IsInt, IsOptional } from 'class-validator';
import { ClientExtraDto } from 'src/api/common/dtos/requests';
import { MealType } from '../../../domain/enum/meal-type.enum';

export type MealDateInput = '오늘' | '내일' | string;
export type MealTypeInput = MealType;

export class ListMealScheduleRequestDto extends ClientExtraDto {
  @IsDefined({ message: 'restaurantId는 필수입니다.' })
  @IsInt()
  @ApiProperty({ description: '식당 ID', example: 1 })
  restaurantId: number;

  @IsOptional()
  @ApiPropertyOptional({
    description: '날짜. 오늘/내일 또는 YYYY-MM-DD를 허용합니다.',
    example: '오늘',
  })
  date?: MealDateInput;

  @IsOptional()
  @IsIn(Object.values(MealType))
  @ApiPropertyOptional({
    description: '끼니 타입.',
    enum: MealType,
    example: MealType.LUNCH,
  })
  mealType?: MealTypeInput;
}
