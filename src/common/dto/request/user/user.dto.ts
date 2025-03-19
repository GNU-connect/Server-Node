import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, ValidateNested } from "class-validator";

export class UserDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsString()
  id: string;
}

export class UserRequestDto {
  @ApiHideProperty()
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;
}