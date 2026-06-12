import { ApiProperty } from '@nestjs/swagger';
import { ClientExtraDto } from 'src/api/common/dtos/requests';
import { DietTime, RelativeDietDate } from 'src/api/public/cafeterias/application/utils/time';

export type DietDate = RelativeDietDate;

export class ListCafeteriaDietExtraRequestDto extends ClientExtraDto {
  @ApiProperty({ description: '식당 ID', example: 1 })
  cafeteriaId: number;

  @ApiProperty({ description: '날짜', example: '오늘' })
  date: DietDate;

  @ApiProperty({ description: '식사 시간', example: '아침' })
  time?: DietTime;
}
