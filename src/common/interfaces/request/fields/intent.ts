import { Knowledge } from './etc';

export interface Intent {
  id: string;
  name: string;
  extra: IntentExtra;
}

export interface IntentExtra {
  reason?: Reason;
  knowledge?: KnowledgeExtra;
}

export interface Reason {
  code: number;
  message: string;
}

export interface KnowledgeExtra {
  responseType: 'skill';
  matchedKnowledges: Knowledge[];
}
