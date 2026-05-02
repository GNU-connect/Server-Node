import { ApiProperty } from '@nestjs/swagger';
import { ClientExtraDto } from 'src/api/common/dtos/requests';

export type DietDate = '오늘' | '내일';
export type DietTime = '아침' | '점심' | '저녁';

export class ListCafeteriaDietExtraRequestDto extends ClientExtraDto {
  @ApiProperty({ description: '식당 ID', example: 1 })
  cafeteriaId: number;

  @ApiProperty({ description: '날짜', example: '오늘' })
  date: DietDate;

  @ApiProperty({ description: '식사 시간', example: '아침' })
  time?: DietTime;
}
