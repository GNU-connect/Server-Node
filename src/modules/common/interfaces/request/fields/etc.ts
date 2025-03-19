export interface Knowledge {
  categories: string[];
  question: string;
  answer: string;
  imageUrl?: string;
  landingUrl?: string;
}

export interface DetailParam {
  origin: string;
  value: any;
  groupName: string;
}

export interface Block {
  id: string;
  name: string;
}

export interface User {
  id: string;
  type: 'botUserKey';
  properties: UserProperties;
}

export interface UserProperties {
  plusfriendUserKey?: string;
  appUserId?: string;
  isFriend?: boolean;
}
