import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsIn, IsISO8601 } from 'class-validator';
import { DietTime } from 'src/api/public/cafeterias/application/utils/time';

export class GetCafeteriaDietQueryDto {
  @IsDefined({ message: 'date는 필수입니다.' })
  @IsISO8601({ strict: true }, { message: 'date는 유효한 날짜여야 합니다.' })
  @ApiProperty({
    description: '날짜 (YYYY-MM-DD).',
    example: '2026-04-21',
  })
  date: string;

  @IsDefined({ message: 'time은 필수입니다.' })
  @IsIn(['아침', '점심', '저녁'])
  @ApiProperty({
    description: '식사 시간.',
    enum: ['아침', '점심', '저녁'],
  })
  time: DietTime;
}
