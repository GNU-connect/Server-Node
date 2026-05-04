import { MealType } from './enum/meal-type.enum';

export class MealQueryCondition {
  constructor(
    public readonly restaurantId: number,
    public readonly date: Date,
    public readonly mealType: MealType,
    public readonly campusId?: number,
  ) {}
}
