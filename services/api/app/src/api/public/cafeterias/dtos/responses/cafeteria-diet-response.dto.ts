import { ApiProperty } from '@nestjs/swagger';
import { CafeteriaResponseDto } from './cafeteria-response.dto';

export class MenuCategoryDto {
  @ApiProperty({ description: '카테고리명' })
  category: string;

  @ApiProperty({ description: '해당 카테고리의 음식명 목록', type: [String] })
  items: string[];
}

export class CafeteriaDietResponseDto {
  @ApiProperty({ description: '식당 정보', type: CafeteriaResponseDto })
  cafeteria: CafeteriaResponseDto;

  @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2026-04-21' })
  date: string;

  @ApiProperty({ description: '식사 시간', enum: ['아침', '점심', '저녁'] })
  time: string;

  @ApiProperty({ description: '카테고리별 메뉴 목록', type: [MenuCategoryDto] })
  menus: MenuCategoryDto[];
}
