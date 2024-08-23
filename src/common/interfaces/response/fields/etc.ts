export interface Thumbnail {
  imageUrl: string;
  width?: number;
  height?: number;
}

export interface Head {
  name?: string;
  version?: string;
  description?: string;
}

export interface Profile {
  imageUrl?: string;
  title?: string;
}

export interface ImageTitle {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface ListItem {
  title: string;
  description?: string;
  imageUrl?: string;
  link?: Link;
  action?: 'block' | 'message';
  blockId?: string;
  messageText?: string;
  extra?: Record<string, any>;
}

export interface ItemList {
  title: string;
  description: string;
}

export interface ItemListSummary {
  title: string;
  description: string;
}

export interface Link {
  web?: string;
}

export interface Button {
  label: string;
  action: 'webLink' | 'phone' | 'share' | 'block' | 'message';
  webLinkUrl?: string;
  phoneNumber?: string;
  blockId?: string;
  messageText?: string;
}

export interface QuickReply {
  label: string;
  action: 'block' | 'message';
  blockId?: string;
  messageText?: string;
}
