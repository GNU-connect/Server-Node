import { ContextControl } from './fields/context';
import { SkillTemplate } from './fields/template';

export interface SkillResponse<T = any> {
  version: string;
  template: SkillTemplate;
  context?: ContextControl;
  data?: Map<string, any>;
}
