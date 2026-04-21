import { ApiProperty } from '@nestjs/swagger';

export class NativeResponseDto<T> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiProperty()
  data: T;

  constructor(data: T, message = 'OK', statusCode = 200) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
