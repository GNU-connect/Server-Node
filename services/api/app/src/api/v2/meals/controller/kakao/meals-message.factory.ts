import { Injectable } from '@nestjs/common';
import { BasicCard, ListCard } from 'src/api/common/interfaces/response/fields/component';
import { Button, ListItem, QuickReply } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createBasicCard, createListCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import { MealType } from '../../domain/enum/meal-type.enum';
import { MealScheduleResponseDto } from '../../dto/meal-schedule-response.dto';
import { RestaurantResponseDto } from '../../dto/restaurant-response.dto';

@Injectable()
export class MealsMessageFactory {
  createRestaurantListCard(restaurants: RestaurantResponseDto[]): SkillTemplate {
    const header: ListItem = {
      title: '어떤 교내 식당 정보가 알고 싶어?',
    };

    const items: ListItem[] = restaurants.map(restaurant => ({
      title: restaurant.name,
      description: restaurant.campus.name,
      imageUrl: restaurant.campus.thumbnailUrl,
      action: 'block',
      blockId: BlockId.CAFETERIA_DIET_LIST,
      extra: {
        restaurantId: restaurant.id,
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

    const restaurantListCard: ListCard = createListCard(header, items, buttons);
    return {
      outputs: [restaurantListCard],
    };
  }

  createMealScheduleCard(schedule: MealScheduleResponseDto): SkillTemplate {
    const { restaurant, date, mealType, menuGroups } = schedule;
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    const title = `🍱 ${restaurant.name}(${restaurant.campus?.name.slice(0, 2) ?? ''})`;
    const description = this.createMealDescription(
      date,
      parsedDate.getUTCDay(),
      mealType,
      menuGroups,
    );
    const thumbnail = {
      imageUrl: schedule.restaurant.thumbnailUrl,
    };

    const shareButton: Button = {
      label: '공유하기',
      action: 'share',
    };

    const basicCard: BasicCard = createBasicCard(title, description, thumbnail, [shareButton]);

    return {
      outputs: [basicCard],
      quickReplies: this.createMealDateQuickReplies(restaurant),
    };
  }

  private createMealDescription(
    date: string,
    dayOfWeek: number,
    mealType: MealType,
    menuGroups: MealScheduleResponseDto['menuGroups'],
  ): string {
    const [year, month, day] = date.split('-');
    let description = `${year}-${Number(month)}-${Number(day)}(${this.getDayLabel(
      dayOfWeek,
    )}) ${mealType} 메뉴\n\n`;

    if (menuGroups.length > 0) {
      description += menuGroups
        .map(({ categoryName, items }) => {
          const itemNames = items.map(item => item.name).join('\n');
          return categoryName ? `[${categoryName}]\n${itemNames}` : itemNames;
        })
        .join('\n\n');
    } else {
      description += '메뉴가 없습니다.';
    }

    return description;
  }

  private createMealDateQuickReplies(restaurant: RestaurantResponseDto): QuickReply[] {
    const dates = ['오늘', '내일'] as const;
    const mealTypes = Object.values(MealType);

    return dates.flatMap(date =>
      mealTypes.map(mealType => ({
        label: `${date} ${mealType}`,
        action: 'block',
        blockId: BlockId.CAFETERIA_DIET_LIST,
        extra: {
          restaurantId: restaurant.id,
          date,
          mealType,
        },
      })),
    );
  }

  private getDayLabel(dayOfWeek: number): string {
    return ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek];
  }
}
