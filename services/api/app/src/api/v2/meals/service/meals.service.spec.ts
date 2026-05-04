import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelType } from '../domain/enum/channel-type.enum';
import { Campus } from '../../campus/domain/campus.domain';
import { DateMealSelectionPolicy } from '../domain/date-meal-selection-policy.domain';
import { MealQueryCondition } from '../domain/meal-query-condition.domain';
import { MealSchedule } from '../domain/meal-schedule.domain';
import { MealType } from '../domain/enum/meal-type.enum';
import { MenuGroup } from '../domain/menu-group.domain';
import { MenuItem } from '../domain/menu-item.domain';
import { Restaurant } from '../domain/restaurant.domain';
import { MealsRepository } from '../repository/meals.repository';
import { MealsService } from './meals.service';

const makeRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant =>
  new Restaurant(
    overrides.id ?? 1,
    overrides.campusId ?? 1,
    overrides.name ?? '제1학생회관',
    overrides.thumbnailUrl ?? 'https://example.com/restaurant.jpg',
    overrides.campus ?? new Campus(1, '가좌캠퍼스', 'https://example.com/campus.jpg'),
  );

describe('MealsService', () => {
  let service: MealsService;
  let mealsRepository: jest.Mocked<MealsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealsService,
        DateMealSelectionPolicy,
        {
          provide: MealsRepository,
          useValue: {
            findRestaurantsByCampusId: jest.fn(),
            findByRestaurantIdAndDateAndMealType: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(MealsService);
    mealsRepository = module.get(MealsRepository);
  });

  describe('getRestaurants', () => {
    it('캠퍼스 ID로 식당 도메인 목록을 반환한다', async () => {
      const restaurants = [makeRestaurant()];
      mealsRepository.findRestaurantsByCampusId.mockResolvedValue(restaurants);

      const result = await service.getRestaurants(1);

      expect(mealsRepository.findRestaurantsByCampusId).toHaveBeenCalledWith(1);
      expect(result).toEqual(restaurants);
      expect(result[0]).toMatchObject({
        id: 1,
        campusId: 1,
        name: '제1학생회관',
      });
    });
  });

  describe('getMealSchedule', () => {
    it('조건에 맞는 MealSchedule 도메인을 반환한다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      const restaurant = makeRestaurant({ id: 5 });
      const mealSchedule = new MealSchedule(restaurant, date, MealType.LUNCH, [
        new MenuGroup('한식', [new MenuItem('김치찌개', ''), new MenuItem('제육볶음', '')]),
      ]);
      mealsRepository.findByRestaurantIdAndDateAndMealType.mockResolvedValue(mealSchedule);

      const result = await service.getMealSchedule(new MealQueryCondition(5, date, MealType.LUNCH));

      expect(result).toBe(mealSchedule);
      expect(result.hasMenu()).toBe(true);
      expect(mealsRepository.findByRestaurantIdAndDateAndMealType).toHaveBeenCalledWith(
        5,
        date,
        MealType.LUNCH,
      );
    });

    it('메뉴가 없으면 빈 메뉴 그룹과 hasMenu=false를 반환한다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      const restaurant = makeRestaurant();
      mealsRepository.findByRestaurantIdAndDateAndMealType.mockResolvedValue(
        new MealSchedule(restaurant, date, MealType.DINNER, []),
      );

      const result = await service.getMealSchedule(
        new MealQueryCondition(1, date, MealType.DINNER),
      );

      expect(result.menuGroups).toEqual([]);
      expect(result.hasMenu()).toBe(false);
    });

    it('식당을 찾을 수 없으면 NotFoundException을 던진다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      mealsRepository.findByRestaurantIdAndDateAndMealType.mockResolvedValue(null);

      await expect(
        service.getMealSchedule(new MealQueryCondition(999, date, MealType.LUNCH)),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DateMealSelectionPolicy', () => {
    it('MOBILE 입력의 ISO date와 한글 mealType을 그대로 도메인 조건으로 만든다', () => {
      const condition = service.createMealQueryCondition({
        restaurantId: 1,
        date: '2026-04-21',
        mealType: MealType.LUNCH,
        channel: ChannelType.MOBILE,
        now: new Date('2026-04-20T00:00:00.000Z'),
      });

      expect(condition.date.toISOString().slice(0, 10)).toBe('2026-04-21');
      expect(condition.mealType).toBe(MealType.LUNCH);
    });

    it('CHATBOT 입력의 오늘/내일과 한글 끼니를 도메인 조건으로 변환한다', () => {
      const condition = service.createMealQueryCondition({
        restaurantId: 1,
        date: '내일',
        mealType: '저녁',
        channel: ChannelType.CHATBOT,
        now: new Date('2026-04-20T00:00:00.000Z'),
      });

      expect(condition.date.toISOString().slice(0, 10)).toBe('2026-04-21');
      expect(condition.mealType).toBe(MealType.DINNER);
    });
  });
});
