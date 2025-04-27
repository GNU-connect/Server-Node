import { Action } from './fields/action';
import { Bot } from './fields/bot';
import { Intent } from './fields/intent';
import { UserRequest } from './fields/userRequest';

export interface SkillPayload {
  bot: Bot;
  intent: Intent;
  action: Action;
  userRequest: UserRequest;
  contexts?: any[];
}
