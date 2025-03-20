import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { ClientExtraDto } from "src/modules/common/dtos/requests";

export class ListReadingRoomsRequestDto extends ClientExtraDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1
  })
  campusId: number
}