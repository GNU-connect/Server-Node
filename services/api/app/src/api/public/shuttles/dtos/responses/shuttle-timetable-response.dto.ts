import { ApiProperty } from '@nestjs/swagger';

export class TimeEntryDto {
  @ApiProperty({ description: '출발 시각 (HH:mm)', example: '15:30' })
  time: string;

  @ApiProperty({ description: '부가 메모 (예: 금요일 미운행)', nullable: true, example: null })
  memo: string | null;

  @ApiProperty({ description: '현재 시각 기준 상태', enum: ['past', 'next', 'future'] })
  status: 'past' | 'next' | 'future';
}

export class TimetableSectionDto {
  @ApiProperty({ description: '섹션명 (예: 오전, 오후)' })
  label: string;

  @ApiProperty({ type: [TimeEntryDto] })
  times: TimeEntryDto[];
}

export class NextBusDto {
  @ApiProperty({ description: '다음 버스 시각 (HH:mm)', example: '15:30' })
  time: string;

  @ApiProperty({ description: '현재 시각 기준 N분 후', example: 25 })
  minutesUntil: number;
}

export class ShuttleTimetableResponseDto {
  @ApiProperty({ description: '노선명' })
  routeName: string;

  @ApiProperty({ description: '다음 버스 정보. 오늘 운행 종료 시 null', nullable: true, type: NextBusDto })
  nextBus: NextBusDto | null;

  @ApiProperty({ type: [TimetableSectionDto] })
  sections: TimetableSectionDto[];

  @ApiProperty({ description: '시간표 마지막 업데이트 날짜 (YYYY.MM.DD)', example: '2026.03.13' })
  updatedAt: string;
}
