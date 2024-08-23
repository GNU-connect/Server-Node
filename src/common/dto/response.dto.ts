import { Expose, Exclude } from 'class-transformer';
import { ContextControl } from 'src/common/interfaces/response/fields/context';
import { SkillResponse } from 'src/common/interfaces/response/response';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';

export class ResponseDTO<T = any> implements SkillResponse<T> {
  @Exclude()
  version: string;

  @Expose()
  template: SkillTemplate;

  @Expose()
  context?: ContextControl;

  @Expose()
  data?: Map<string, T>;

  constructor(
    template: SkillTemplate,
    context?: ContextControl,
    data?: Map<string, T>,
  ) {
    this.version = '2.0'; // 버전은 고정값
    this.template = template;
    this.context = context;
    this.data = data;
  }
}
