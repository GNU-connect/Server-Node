import { MealType } from './enum/meal-type.enum';
import { MenuGroup } from './menu-group.domain';
import { Restaurant } from './restaurant.domain';

export class MealSchedule {
  constructor(
    public readonly restaurant: Restaurant,
    public readonly date: Date,
    public readonly mealType: MealType,
    public readonly menuGroups: MenuGroup[],
  ) {}

  hasMenu(): boolean {
    return this.menuGroups.some(group => group.items.length > 0);
  }
}
