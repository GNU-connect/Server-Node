import { Injectable } from '@nestjs/common';
import { BasicCard, ListCard } from 'src/api/common/interfaces/response/fields/component';
import { Button, ListItem, QuickReply } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createBasicCard, createListCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import {
  DietDate,
  DietTime,
} from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { CafeteriaDietResponseDto } from 'src/api/public/cafeterias/dtos/responses/cafeteria-diet-response.dto';
import { CafeteriaResponseDto } from 'src/api/public/cafeterias/dtos/responses/cafeteria-response.dto';
import { getDayWeek } from 'src/api/public/cafeterias/utils/time';

@Injectable()
export class CafeteriaMessageFactory {
  public createCafeteriaListCard(result: CafeteriaResponseDto[]): SkillTemplate {
    const header: ListItem = {
      title: '어떤 교내 식당 정보가 알고 싶어?',
    };

    const items: ListItem[] = result.map(cafeteria => ({
      title: cafeteria.name,
      description: cafeteria.campus.name,
      imageUrl: cafeteria.thumbnailUrl,
      action: 'block',
      blockId: BlockId.CAFETERIA_DIET_LIST,
      extra: {
        cafeteriaId: cafeteria.id,
      },
    }));

    const buttons: Button[] = [
      {
        label: '더보기',
        action: 'block',
        blockId: BlockId.CAFETERIA_LIST,
        extra: {
          campusId: -1,
        },
      },
    ];

    const cafeteriaDietListCard: ListCard = createListCard(header, items, buttons);

    return {
      outputs: [cafeteriaDietListCard],
    };
  }

  public createCafeteriaDietListCard(result: CafeteriaDietResponseDto): SkillTemplate {
    const { cafeteria, date, time, menus } = result;
    const parsedDate = new Date(date);
    const title = `🍱 ${cafeteria.name}(${cafeteria.campus.name.slice(0, 2)})`;
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();

    let description = `${year}-${month}-${day}(${getDayWeek(parsedDate)}) ${time} 메뉴\n\n`;

    if (menus.length > 0) {
      description += menus
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

  private createDishDateQuickReplies(cafeteria: CafeteriaResponseDto): QuickReply[] {
    const dishDateTypes: DietDate[] = ['오늘', '내일'];
    const times: DietTime[] = ['아침', '점심', '저녁'];

    return dishDateTypes.flatMap(dishDateType =>
      times.map(time => ({
        label: `${dishDateType} ${time}`,
        action: 'block',
        blockId: BlockId.CAFETERIA_DIET_LIST,
        extra: {
          cafeteriaId: cafeteria.id,
          date: dishDateType,
          time,
        },
      })),
    );
  }
}
