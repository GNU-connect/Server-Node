import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { ActionDto } from "./action";

export class SkillPayloadDto {
  @ApiProperty({ description: 'Action 정보' })
  @ValidateNested()
  @Type(() => ActionDto)
  action: ActionDto;
}