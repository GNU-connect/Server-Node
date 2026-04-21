import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';
import { DietTime } from './list-cafeteria-diet-request.dto';

export class GetCafeteriaDietQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date는 YYYY-MM-DD 형식이어야 합니다.' })
  @ApiPropertyOptional({
    description: '날짜 (YYYY-MM-DD). 생략 시 오늘 날짜.',
    example: '2026-04-21',
  })
  date?: string;

  @IsOptional()
  @IsIn(['아침', '점심', '저녁'])
  @ApiPropertyOptional({
    description: '식사 시간. 생략 시 현재 시간 기준 자동 결정.',
    enum: ['아침', '점심', '저녁'],
  })
  time?: DietTime;
}
