import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import { DietTime } from './list-cafeteria-diet-request.dto';

export class GetCafeteriaDietQueryDto {
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'date는 유효한 날짜여야 합니다.' })
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
