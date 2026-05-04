import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';
import { ChannelType } from '../domain/enum/channel-type.enum';
import { DateMealSelectionPolicy } from '../domain/date-meal-selection-policy.domain';
import { MealQueryCondition } from '../domain/meal-query-condition.domain';
import { MealSchedule } from '../domain/meal-schedule.domain';
import { MealType } from '../domain/enum/meal-type.enum';
import { Restaurant } from '../domain/restaurant.domain';
import { MealsRepository } from '../repository/meals.repository';

interface CreateMealQueryConditionParams {
  restaurantId: number;
  date?: string;
  mealType?: string;
  channel: ChannelType;
  now?: Date;
}

@Injectable()
export class MealsService {
  readonly logger = new Logger(MealsService.name);

  constructor(
    private readonly mealsRepository: MealsRepository,
    private readonly dateMealSelectionPolicy: DateMealSelectionPolicy,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([campusId]) => `v2:restaurants:campus:${campusId as number}`,
  })
  async getRestaurants(campusId: number): Promise<Restaurant[]> {
    return this.mealsRepository.findRestaurantsByCampusId(campusId);
  }

  createMealQueryCondition(params: CreateMealQueryConditionParams): MealQueryCondition {
    const now = params.now ?? new Date();
    const date = this.dateMealSelectionPolicy.resolveDate(now, params.channel, params.date);
    const mealType = this.dateMealSelectionPolicy.resolveMealType(now, params.mealType as MealType);
    return new MealQueryCondition(params.restaurantId, date, mealType);
  }

  @CacheKey({
    key: ([condition]) => {
      const { restaurantId, date, mealType } = condition as MealQueryCondition;
      return `v2:meal-schedule:${restaurantId}:${date.toISOString().slice(0, 10)}:${mealType}`;
    },
  })
  async getMealSchedule(condition: MealQueryCondition): Promise<MealSchedule> {
    const mealSchedule = await this.mealsRepository.findByRestaurantIdAndDateAndMealType(
      condition.restaurantId,
      condition.date,
      condition.mealType,
    );

    if (!mealSchedule) {
      throw new NotFoundException(`식당(${condition.restaurantId}) 정보를 찾을 수 없습니다.`);
    }

    return mealSchedule;
  }
}
