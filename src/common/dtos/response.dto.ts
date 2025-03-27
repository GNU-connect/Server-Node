import { Expose, Exclude } from 'class-transformer';

export class ResponseDTO<T = any> {
  @Exclude()
  version: string;

  @Expose()
  template: any;

  @Expose()
  context?: any;

  @Expose()
  data?: Map<string, T>;

  constructor(
    template: any,
    context?: any,
    data?: Map<string, T>,
  ) {
    this.version = '2.0'; // 버전은 고정값
    this.template = template;
    this.context = context;
    this.data = data;
  }
}
