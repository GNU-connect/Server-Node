import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CafeteriaResponseDto } from './cafeteria-response.dto';

export class DietItemDto {
  @ApiPropertyOptional({ description: '음식 카테고리' })
  category: string | null;

  @ApiProperty({ description: '음식명' })
  name: string;
}

export class CafeteriaDietResponseDto {
  @ApiProperty({ description: '식당 정보', type: CafeteriaResponseDto })
  cafeteria: CafeteriaResponseDto;

  @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2026-04-21' })
  date: string;

  @ApiProperty({ description: '식사 시간', enum: ['아침', '점심', '저녁'] })
  time: string;

  @ApiProperty({ description: '식단 목록', type: [DietItemDto] })
  items: DietItemDto[];
}
