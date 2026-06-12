import { Injectable } from '@nestjs/common';
import { BasicCard, ListCard } from 'src/api/common/interfaces/response/fields/component';
import { Button, ListItem, QuickReply } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createBasicCard, createListCard } from 'src/api/common/utils/component';
import {
  KakaoBlockId,
  KAKAO_REQUEST_CAMPUS_SELECTION_ID,
} from 'src/api/common/presentation/kakao.constants';
import {
  DietTime,
  getDayWeek,
  RelativeDietDate,
} from 'src/api/public/cafeterias/application/utils/time';
import { CafeteriaDietResult } from 'src/api/public/cafeterias/application/dtos/results/cafeteria-diet-result.dto';
import {
  CafeteriaItemResult,
  CafeteriaListResult,
} from 'src/api/public/cafeterias/application/dtos/results/cafeteria-list-result.dto';

@Injectable()
export class CafeteriaMessageFactory {
  public createCafeteriaListCard(result: CafeteriaListResult): SkillTemplate {
    const header: ListItem = {
      title: '어떤 교내 식당 정보가 알고 싶어?',
    };

    const items: ListItem[] = result.cafeterias.map(cafeteria => ({
      title: cafeteria.name,
      description: cafeteria.campus.name,
      imageUrl: cafeteria.thumbnailUrl,
      action: 'block',
      blockId: KakaoBlockId.CAFETERIA_DIET_LIST,
      extra: {
        cafeteriaId: cafeteria.id,
      },
    }));

    const buttons: Button[] = [
      {
        label: '더보기',
        action: 'block',
        blockId: KakaoBlockId.CAFETERIA_LIST,
        extra: {
          campusId: KAKAO_REQUEST_CAMPUS_SELECTION_ID,
        },
      },
    ];

    const cafeteriaDietListCard: ListCard = createListCard(header, items, buttons);

    return {
      outputs: [cafeteriaDietListCard],
    };
  }

  public createCafeteriaDietListCard(result: CafeteriaDietResult): SkillTemplate {
    const { cafeteria, date, time, menuGroups } = result;
    const title = `🍱 ${cafeteria.name}(${cafeteria.campus.name.slice(0, 2)})`;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let description = `${year}-${month}-${day}(${getDayWeek(date)}) ${time} 메뉴\n\n`;

    if (menuGroups.length > 0) {
      description += menuGroups
        .map(({ category, items }) => {
          if (category) {
            return `[${category}]\n${items.join('\n')}`;
          } else {
            return items.join('\n');
          }
        })
        .join('\n\n');
    } else {
      description += '메뉴가 없습니다.';
    }

    // 썸네일 이미지
    const thumbnail = {
      imageUrl: cafeteria.thumbnailUrl,
    };

    // 공유하기 버튼
    const shareButton: Button = {
      label: '공유하기',
      action: 'share',
    };

    const basicCard: BasicCard = createBasicCard(title, description, thumbnail, [shareButton]);

    const quickReplies: QuickReply[] = this.createDishDateQuickReplies(cafeteria);

    return {
      outputs: [basicCard],
      quickReplies,
    };
  }

  private createDishDateQuickReplies(cafeteria: CafeteriaItemResult): QuickReply[] {
    const dishDateTypes: RelativeDietDate[] = ['오늘', '내일'];
    const times: DietTime[] = ['아침', '점심', '저녁'];

    return dishDateTypes.flatMap(dishDateType =>
      times.map(time => ({
        label: `${dishDateType} ${time}`,
        action: 'block',
        blockId: KakaoBlockId.CAFETERIA_DIET_LIST,
        extra: {
          cafeteriaId: cafeteria.id,
          date: dishDateType,
          time,
        },
      })),
    );
  }
}
