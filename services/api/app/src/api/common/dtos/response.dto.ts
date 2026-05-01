import { ApiProperty } from '@nestjs/swagger';

export class ResponseDTO {
  @ApiProperty({ example: '2.0' })
  version: string;

  @ApiProperty()
  template: any;

  constructor(template: any) {
    this.version = '2.0';
    this.template = template;
  }
}
