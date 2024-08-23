import {
  Button,
  Head,
  ImageTitle,
  ItemList,
  ItemListSummary,
  ListItem,
  Profile,
  Thumbnail,
} from '../interfaces/response/fields/etc';
import {
  SimpleText,
  SimpleImage,
  BasicCard,
  CommerceCard,
  ListCard,
  ItemCard,
  Component,
} from '../interfaces/response/fields/component';

// SimpleText 생성 함수
export function createSimpleText(text: string): SimpleText {
  return {
    simpleText: {
      text,
    },
  };
}

// SimpleImage 생성 함수
export function createSimpleImage(
  imageUrl: string,
  altText: string,
): SimpleImage {
  return {
    simpleImage: {
      imageUrl,
      altText,
    },
  };
}

// BasicCard 생성 함수
export function createBasicCard(
  title?: string,
  description?: string,
  thumbnail?: Thumbnail,
  buttons?: Array<Button>,
): BasicCard {
  return {
    basicCard: {
      title,
      description,
      thumbnail,
      buttons,
    },
  };
}

// CommerceCard 생성 함수
export function createCommerceCard(
  price: number,
  thumbnails: Array<Thumbnail>,
  title?: string,
  description?: string,
  currency?: string,
  discount?: number,
  discountRate?: number,
  discountedPrice?: number,
  profile?: Profile,
  buttons?: Array<Button>,
): CommerceCard {
  return {
    commerceCard: {
      title,
      description,
      price,
      currency,
      discount,
      discountRate,
      discountedPrice,
      thumbnails,
      profile,
      buttons,
    },
  };
}

// ListCard 생성 함수
export function createListCard(
  header: ListItem,
  items: Array<ListItem>,
  buttons?: Array<Button>,
): ListCard {
  return {
    listCard: {
      header,
      items,
      buttons,
    },
  };
}

// ItemCard 생성 함수
export function createItemCard(
  itemList: Array<ItemList>,
  thumbnail?: Thumbnail,
  head?: Head,
  profile?: Profile,
  imageTitle?: ImageTitle,
  itemListAlignment?: 'left' | 'right',
  itemListSummary?: ItemListSummary,
  buttons?: Array<Button>,
  buttonLayout?: 'vertical' | 'horizontal',
): ItemCard {
  return {
    itemCard: {
      thumbnail,
      head,
      profile,
      imageTitle,
      itemList,
      itemListAlignment,
      itemListSummary,
      buttons,
      buttonLayout,
    },
  };
}

// 모든 타입의 Component를 생성할 수 있는 유틸리티 함수
export function createComponent(component: Component): Component {
  return component;
}
