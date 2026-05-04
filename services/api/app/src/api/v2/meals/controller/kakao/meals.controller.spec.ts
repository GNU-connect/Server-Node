import { Test, TestingModule } from '@nestjs/testing';
import { CampusMessageFactory } from 'src/api/public/campuses/campus-message.factory';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { User } from 'src/type-orm/entities/users/users.entity';
import { ChannelType } from '../../domain/enum/channel-type.enum';
import { Campus } from '../../../campus/domain/campus.domain';
import { MealQueryCondition } from '../../domain/meal-query-condition.domain';
import { MealSchedule } from '../../domain/meal-schedule.domain';
import { MealType } from '../../domain/enum/meal-type.enum';
import { MenuGroup } from '../../domain/menu-group.domain';
import { MenuItem } from '../../domain/menu-item.domain';
import { Restaurant } from '../../domain/restaurant.domain';
import { ListMealScheduleRequestDto } from './dto/list-meal-schedule-request.dto';
import { ListRestaurantsRequestDto } from './dto/list-restaurants-request.dto';
import { MealsMessageFactory } from './meals-message.factory';
import { MealsNativeController } from '../native/meals.controller';
import { MealsService } from '../../service/meals.service';
import { MealsKakaoController } from './meals.controller';

const restaurant = new Restaurant(
  5,
  1,
  '제1학생회관',
  'https://example.com/restaurant.jpg',
  new Campus(1, '가좌캠퍼스', 'https://example.com/campus.jpg'),
);
const condition = new MealQueryCondition(5, new Date('2026-04-21T00:00:00.000Z'), MealType.LUNCH);
const schedule = new MealSchedule(restaurant, condition.date, MealType.LUNCH, [
  new MenuGroup('한식', [new MenuItem('김치찌개', '')]),
]);

describe('MealsKakaoController', () => {
  let nativeController: MealsNativeController;
  let chatbotController: MealsKakaoController;
  let mealsService: jest.Mocked<MealsService>;
  let campusesService: jest.Mocked<CampusesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealsNativeController, MealsKakaoController],
      providers: [
        MealsMessageFactory,
        CampusMessageFactory,
        {
          provide: MealsService,
          useValue: {
            getRestaurants: jest.fn(),
            createMealQueryCondition: jest.fn(),
            getMealSchedule: jest.fn(),
          },
        },
        {
          provide: CampusesService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    nativeController = module.get(MealsNativeController);
    chatbotController = module.get(MealsKakaoController);
    mealsService = module.get(MealsService);
    campusesService = module.get(CampusesService);
  });

  it('모바일 식당 목록 controller는 v2 식당 목록을 반환한다', async () => {
    mealsService.getRestaurants.mockResolvedValue([restaurant]);

    const response = await nativeController.getRestaurants({ campusId: 1 });

    expect(response.data).toEqual([
      {
        id: 5,
        campusId: 1,
        name: '제1학생회관',
        thumbnailUrl: 'https://example.com/restaurant.jpg',
        campus: {
          id: 1,
          name: '가좌캠퍼스',
          thumbnailUrl: 'https://example.com/campus.jpg',
        },
      },
    ]);
  });

  it('모바일 식단 controller는 v2 식단을 반환한다', async () => {
    mealsService.createMealQueryCondition.mockReturnValue(condition);
    mealsService.getMealSchedule.mockResolvedValue(schedule);

    const response = await nativeController.getMealSchedule(5, {
      date: '2026-04-21',
      mealType: MealType.LUNCH,
    });

    expect(mealsService.createMealQueryCondition).toHaveBeenCalledWith({
      restaurantId: 5,
      date: '2026-04-21',
      mealType: '점심',
      channel: ChannelType.MOBILE,
    });
    expect(response.data).toMatchObject({
      restaurant,
      date: '2026-04-21',
      mealType: '점심',
      hasMenu: true,
      menuGroups: [
        {
          categoryName: '한식',
          items: [{ name: '김치찌개', description: '' }],
        },
      ],
    });
  });

  it('챗봇 식당 목록 controller는 restaurantId extra를 포함한 카드를 반환한다', async () => {
    mealsService.getRestaurants.mockResolvedValue([restaurant]);

    const response = await chatbotController.listRestaurants(undefined, {
      campusId: 1,
    } as ListRestaurantsRequestDto);

    expect(response.version).toBe('2.0');
    expect(response.template.outputs[0].listCard.items[0].extra).toEqual({
      restaurantId: 5,
    });
  });

  it('챗봇 식당 목록 controller는 캠퍼스 미지정 시 캠퍼스 선택 카드를 반환한다', async () => {
    campusesService.findAll.mockResolvedValue({
      campuses: [{ id: 1, name: '가좌캠퍼스', thumbnailUrl: 'https://example.com/campus.jpg' }],
    });

    const response = await chatbotController.listRestaurants(
      { campus: null } as User,
      {} as ListRestaurantsRequestDto,
    );

    expect(response.template.outputs[0].listCard.header.title).toBe('캠퍼스 선택');
  });

  it('챗봇 식단 controller는 챗봇 입력을 v2 식단 카드로 반환한다', async () => {
    mealsService.createMealQueryCondition.mockReturnValue(condition);
    mealsService.getMealSchedule.mockResolvedValue(schedule);

    const response = await chatbotController.listMealSchedules({
      restaurantId: 5,
      date: '오늘',
      mealType: '점심',
    } as ListMealScheduleRequestDto);

    expect(mealsService.createMealQueryCondition).toHaveBeenCalledWith({
      restaurantId: 5,
      date: '오늘',
      mealType: '점심',
      channel: ChannelType.CHATBOT,
    });
    expect(response.template.outputs[0].basicCard.description).toContain('김치찌개');
  });
});
