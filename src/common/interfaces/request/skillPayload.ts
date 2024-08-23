import { Action } from './fields/action';
import { Bot } from './fields/bot';
import { Intent } from './fields/intent';
import { UserRequest } from './fields/userRequest';

export interface SkillPayload {
  bot: Bot;
  intent: Intent;
  action: Action;
  userRequest: UserRequest;
  contexts?: any[]; // contexts가 빈 배열일 수 있기 때문에 any[]로 정의
}
