import { ContextControl } from './context';
import { SkillTemplate } from './template';

export interface SkillResponse<T = any> {
  version: string; // '2.0'으로 고정
  template: SkillTemplate;
  context?: ContextControl;
  data?: Map<string, any>;
}
