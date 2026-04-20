import { Day } from '@/components/ui/DaySelector';
import { MealType } from '@/components/ui/MealTypeSelector';

export type Campus = '서울캠퍼스' | '안양캠퍼스' | '천안캠퍼스' | '국제캠퍼스';
export type Cafeteria = '학생식당' | '교직원식당' | '카페테리아';

export interface MenuCategory {
  category: string;
  items: string[];
}

export interface MenuData {
  [campus: string]: {
    cafeterias: Cafeteria[];
    menus: {
      [cafeteria: string]: {
        [day in Day]?: {
          [meal in MealType]?: MenuCategory[];
        };
      };
    };
  };
}

const menuData: MenuData = {
  서울캠퍼스: {
    cafeterias: ['학생식당', '교직원식당', '카페테리아'],
    menus: {
      학생식당: {
        월: {
          조식: [
            { category: '국', items: ['된장찌개', '김치찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['계란후라이', '깍두기', '배추김치'] },
          ],
          중식: [
            { category: '국', items: ['미역국', '순두부찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['제육볶음', '시금치나물', '깍두기'] },
            { category: '후식', items: ['요거트'] },
          ],
          석식: [
            { category: '국', items: ['감자국'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['돈까스', '콩나물무침', '배추김치'] },
          ],
        },
        화: {
          조식: [
            { category: '국', items: ['북어국'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['스크램블에그', '배추김치'] },
          ],
          중식: [
            { category: '국', items: ['콩나물국'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['닭갈비', '시래기나물', '깍두기'] },
          ],
          석식: [
            { category: '국', items: ['황태국'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['오삼불고기', '도라지무침', '배추김치'] },
          ],
        },
        수: {
          조식: [
            { category: '국', items: ['시래기된장국'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['두부조림', '배추김치'] },
          ],
          중식: [
            { category: '국', items: ['참치김치찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['소불고기', '취나물', '깍두기'] },
          ],
          석식: [
            { category: '면', items: ['잔치국수'] },
            { category: '반찬', items: ['유부초밥', '배추김치'] },
          ],
        },
        목: {
          조식: [
            { category: '국', items: ['해장국'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['계란말이', '배추김치'] },
          ],
          중식: [
            { category: '국', items: ['청국장'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['삼겹살구이', '상추무침', '깍두기'] },
          ],
          석식: [
            { category: '국', items: ['된장찌개'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['닭볶음탕', '콩자반', '배추김치'] },
          ],
        },
        금: {
          조식: [
            { category: '국', items: ['순두부찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['베이컨볶음', '배추김치'] },
          ],
          중식: [
            { category: '국', items: ['육개장'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['생선가스', '시금치나물', '깍두기'] },
          ],
          석식: [
            { category: '면', items: ['비빔국수'] },
            { category: '반찬', items: ['오이소박이', '배추김치'] },
          ],
        },
        토: {
          중식: [
            { category: '국', items: ['김치찌개'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['스팸구이', '깍두기'] },
          ],
        },
        일: {
          중식: [
            { category: '국', items: ['된장찌개'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['제육볶음', '배추김치'] },
          ],
        },
      },
      교직원식당: {
        월: {
          중식: [
            { category: '국', items: ['갈비탕'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['한우불고기', '나물무침', '배추김치'] },
            { category: '후식', items: ['과일', '요거트'] },
          ],
        },
        화: {
          중식: [
            { category: '국', items: ['홍합탕'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['차돌박이구이', '샐러드', '깍두기'] },
          ],
        },
        수: {
          중식: [
            { category: '국', items: ['낙지연포탕'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['삼겹살', '쌈채소', '배추김치'] },
          ],
        },
        목: {
          중식: [
            { category: '국', items: ['설렁탕'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['돈까스', '야채샐러드', '깍두기'] },
          ],
        },
        금: {
          중식: [
            { category: '국', items: ['짬뽕'] },
            { category: '주식', items: ['볶음밥'] },
            { category: '반찬', items: ['탕수육', '배추김치'] },
          ],
        },
      },
      카페테리아: {
        월: {
          중식: [
            { category: '메인', items: ['치킨버거', '불고기버거'] },
            { category: '사이드', items: ['감자튀김', '코울슬로'] },
            { category: '음료', items: ['아메리카노', '오렌지주스'] },
          ],
        },
        화: {
          중식: [
            { category: '메인', items: ['파스타', '피자'] },
            { category: '사이드', items: ['샐러드', '수프'] },
            { category: '음료', items: ['아이스티', '카페라테'] },
          ],
        },
        수: {
          중식: [
            { category: '메인', items: ['덮밥', '비빔밥'] },
            { category: '사이드', items: ['단무지', '김치'] },
          ],
        },
        목: {
          중식: [
            { category: '메인', items: ['샌드위치', '랩'] },
            { category: '사이드', items: ['과일컵', '요거트'] },
          ],
        },
        금: {
          중식: [
            { category: '메인', items: ['스테이크', '치킨'] },
            { category: '사이드', items: ['감자튀김', '샐러드'] },
            { category: '음료', items: ['콜라', '사이다'] },
          ],
        },
      },
    },
  },
  안양캠퍼스: {
    cafeterias: ['학생식당', '카페테리아'],
    menus: {
      학생식당: {
        월: {
          중식: [
            { category: '국', items: ['김치찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['제육볶음', '나물무침', '깍두기'] },
          ],
        },
        화: {
          중식: [
            { category: '국', items: ['된장찌개'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['닭볶음탕', '시금치나물', '배추김치'] },
          ],
        },
        수: {
          중식: [
            { category: '국', items: ['미역국'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['돈까스', '콩나물무침', '깍두기'] },
          ],
        },
        목: {
          중식: [
            { category: '국', items: ['순두부찌개'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['소불고기', '깻잎나물', '배추김치'] },
          ],
        },
        금: {
          중식: [
            { category: '면', items: ['칼국수'] },
            { category: '반찬', items: ['만두', '깍두기'] },
          ],
        },
      },
      카페테리아: {
        월: {
          중식: [
            { category: '메인', items: ['버거', '핫도그'] },
            { category: '음료', items: ['커피', '주스'] },
          ],
        },
      },
    },
  },
  천안캠퍼스: {
    cafeterias: ['학생식당', '교직원식당'],
    menus: {
      학생식당: {
        월: {
          중식: [
            { category: '국', items: ['된장찌개', '콩나물국'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['불고기', '시금치나물', '배추김치'] },
          ],
        },
        화: {
          중식: [
            { category: '국', items: ['미역국'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['제육볶음', '콩자반', '깍두기'] },
          ],
        },
        수: {
          중식: [
            { category: '국', items: ['김치찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['닭갈비', '취나물', '배추김치'] },
          ],
        },
        목: {
          중식: [
            { category: '국', items: ['갈비탕'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['삼겹살구이', '상추', '쌈장'] },
          ],
        },
        금: {
          중식: [
            { category: '면', items: ['비빔냉면'] },
            { category: '반찬', items: ['수육', '깍두기'] },
          ],
        },
      },
      교직원식당: {
        월: {
          중식: [
            { category: '코스', items: ['오늘의 수프', '메인 요리', '샐러드', '디저트'] },
          ],
        },
      },
    },
  },
  국제캠퍼스: {
    cafeterias: ['학생식당', '카페테리아'],
    menus: {
      학생식당: {
        월: {
          중식: [
            { category: '국', items: ['순두부찌개'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['양념치킨', '오이무침', '배추김치'] },
          ],
        },
        화: {
          중식: [
            { category: '국', items: ['된장찌개'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['스파게티', '샐러드', '깍두기'] },
          ],
        },
        수: {
          중식: [
            { category: '아시안', items: ['볶음밥', '짜장면'] },
            { category: '반찬', items: ['탕수육', '단무지'] },
          ],
        },
        목: {
          중식: [
            { category: '국', items: ['미역국'] },
            { category: '주식', items: ['쌀밥'] },
            { category: '반찬', items: ['돈까스', '콩나물', '배추김치'] },
          ],
        },
        금: {
          중식: [
            { category: '국', items: ['육개장'] },
            { category: '주식', items: ['쌀밥', '잡곡밥'] },
            { category: '반찬', items: ['생선구이', '시금치나물', '깍두기'] },
          ],
        },
      },
      카페테리아: {
        월: {
          중식: [
            { category: '메인', items: ['피자', '파스타'] },
            { category: '음료', items: ['커피', '스무디'] },
          ],
        },
      },
    },
  },
};

export const CAMPUSES: Campus[] = ['서울캠퍼스', '안양캠퍼스', '천안캠퍼스', '국제캠퍼스'];

export function getCafeterias(campus: Campus): Cafeteria[] {
  return menuData[campus]?.cafeterias ?? [];
}

export function getMenu(
  campus: Campus,
  cafeteria: Cafeteria,
  day: Day,
  mealType: MealType
): MenuCategory[] {
  return menuData[campus]?.menus?.[cafeteria]?.[day]?.[mealType] ?? [];
}

export function getDayLabel(day: Day): string {
  const map: Record<Day, string> = {
    월: '월요일',
    화: '화요일',
    수: '수요일',
    목: '목요일',
    금: '금요일',
    토: '토요일',
    일: '일요일',
  };
  return map[day];
}
