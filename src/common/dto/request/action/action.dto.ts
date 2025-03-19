import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Allow, ValidateNested } from "class-validator";

export class ClientExtraDto {}

export class ActionDto {
  @ApiProperty({ description: '추가 클라이언트 정보' })
  @ValidateNested()
  @Type(() => ClientExtraDto)
  clientExtra: ClientExtraDto;
}