import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { ClientExtraDto } from "src/modules/common/dtos/requests";

export class GetReadingRoomDetailRequestDto extends ClientExtraDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: '열람실 ID',
    default: 1
  })
  readingRoomId: number
}