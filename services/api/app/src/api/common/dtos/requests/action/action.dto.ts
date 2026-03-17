import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class ClientExtraDto {}

export class DetailParamDto {}

export class ActionDto {
  @ApiProperty({ description: '추가 클라이언트 정보' })
  @ValidateNested()
  @Type(() => ClientExtraDto)
  clientExtra: ClientExtraDto;

  @ApiProperty({ description: 'DetailParams 정보' })
  @ValidateNested()
  @Type(() => DetailParamDto)
  detailParams: DetailParamDto;
}
