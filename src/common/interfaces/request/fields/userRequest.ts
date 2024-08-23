import { Block, User } from './etc';

export interface UserRequest {
  timezone: string;
  params: Record<string, string>;
  block: Block;
  utterance: string;
  lang: string;
  user: User;
}
