import {
  Button,
  Head,
  ImageTitle,
  ItemList,
  ItemListSummary,
  ListItem,
  Profile,
  Thumbnail,
} from './etc';

export type Component =
  | SimpleText
  | SimpleImage
  | TextCard
  | BasicCard
  | CommerceCard
  | ListCard
  | ItemCard;

export interface SimpleText {
  simpleText: {
    text: string;
  };
}

export interface SimpleImage {
  simpleImage: {
    imageUrl: string;
    altText: string;
  };
}

export interface TextCard {
  textCard: {
    title?: string;
    description?: string;
    buttons?: Array<Button>;
  };
}

export interface BasicCard {
  basicCard: {
    title?: string;
    description?: string;
    thumbnail?: Thumbnail;
    buttons?: Array<Button>;
  };
}

export interface CommerceCard {
  commerceCard: {
    title?: string;
    description?: string;
    price: number;
    currency?: string;
    discount?: number;
    discountRate?: number;
    discountedPrice?: number;
    thumbnails: Array<Thumbnail>;
    profile?: Profile;
    buttons?: Array<Button>;
  };
}

export interface ListCard {
  listCard: {
    header: ListItem;
    items: Array<ListItem>;
    buttons?: Array<Button>;
  };
}

export interface ItemCard {
  itemCard: {
    thumbnail?: Thumbnail;
    head?: Head;
    profile?: Profile;
    imageTitle?: ImageTitle;
    itemList: Array<ItemList>;
    itemListAlignment?: 'left' | 'right';
    itemListSummary?: ItemListSummary;
    buttons?: Array<Button>;
    buttonLayout?: 'vertical' | 'horizontal';
  };
}
