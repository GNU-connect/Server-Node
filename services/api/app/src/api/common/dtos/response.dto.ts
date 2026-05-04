import { ApiProperty } from '@nestjs/swagger';

export class ResponseDTO<T = any> {
  @ApiProperty({ example: '2.0' })
  version: string;

  @ApiProperty()
  template: T;

  constructor(template: T) {
    this.version = '2.0';
    this.template = template;
  }
}
