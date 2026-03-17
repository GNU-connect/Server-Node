import { Component } from './component';
import { QuickReply } from './etc';

export interface SkillTemplate {
  outputs: Array<Component>;
  quickReplies?: Array<QuickReply>;
}
