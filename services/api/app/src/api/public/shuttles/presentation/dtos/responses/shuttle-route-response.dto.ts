import { ApiProperty } from '@nestjs/swagger';

export class ShuttleRouteResponseDto {
  @ApiProperty({ description: '노선명', example: '가좌캠퍼스 → 칠암캠퍼스' })
  routeName: string;

  @ApiProperty({ description: '시간표 마지막 업데이트 일시 (ISO 8601)' })
  updatedAt: string;
}
