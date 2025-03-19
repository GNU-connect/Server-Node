import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsNumber } from "class-validator"

export class GetReadingRoomDto {
  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.campusId)
  @ApiProperty({
    description: '캠퍼스 ID',
    default: 1
  })
  campusId: number
}

export class GetReadingRoomDetailDto {
  @IsNumber()
  @Transform(({ obj }) => obj.action.clientExtra?.readingRoomId)
  @ApiProperty({
    description: '열람실 ID',
    default: 1
  })
  readingRoomId: number
}