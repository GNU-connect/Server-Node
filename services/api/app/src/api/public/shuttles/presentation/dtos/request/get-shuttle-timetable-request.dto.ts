import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ClientExtraDto } from 'src/api/common/dtos/requests';

export class GetShuttleTimetableRequestDto extends ClientExtraDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '셔틀 노선명',
    example: '가좌캠퍼스 → 칠암캠퍼스',
  })
  routeName: string;
}
