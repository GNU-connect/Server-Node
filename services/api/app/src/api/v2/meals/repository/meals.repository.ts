import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { Repository } from 'typeorm';
import { Campus } from '../../campus/domain/campus.domain';
import { MealSchedule } from '../domain/meal-schedule.domain';
import { MealType } from '../domain/enum/meal-type.enum';
import { Restaurant } from '../domain/restaurant.domain';
import { MenuGroup } from '../domain/menu-group.domain';
import { MenuItem } from '../domain/menu-item.domain';

@Injectable()
export class MealsRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly restaurantRepository: Repository<Cafeteria>,
    @InjectRepository(CafeteriaDiet)
    private readonly MealRepository: Repository<CafeteriaDiet>,
  ) {}

  async findRestaurantsByCampusId(campusId = 1): Promise<Restaurant[]> {
    const cafeterias = await this.restaurantRepository.find({
      where: {
        campus: {
          id: campusId,
        },
      },
      order: {
        name: 'ASC',
      },
      relations: ['campus'],
    });

    return cafeterias.map(cafeteria => this.toRestaurant(cafeteria));
  }

  async findRestaurantById(restaurantId: number): Promise<Restaurant | null> {
    const cafeteria = await this.restaurantRepository
      .createQueryBuilder('cafeteria')
      .leftJoinAndSelect('cafeteria.campus', 'campus')
      .where('cafeteria.id = :restaurantId', { restaurantId })
      .getOne();

    return cafeteria ? this.toRestaurant(cafeteria) : null;
  }

  async findByRestaurantIdAndDateAndMealType(
    restaurantId: number,
    date: Date,
    mealType: MealType,
  ): Promise<MealSchedule> {
    const restaurant = await this.findRestaurantById(restaurantId);

    if (!restaurant) {
      return null;
    }

    const menus: CafeteriaDiet[] = await this.MealRepository.find({
      where: {
        date,
        cafeteria: {
          id: restaurantId,
        },
        time: mealType,
      },
    });

    return new MealSchedule(restaurant, date, mealType, this.toMenuGroups(menus));
  }

  private toMenuGroups(menus: CafeteriaDiet[]): MenuGroup[] {
    const grouped = new Map<string, MenuItem[]>();

    for (const menu of menus) {
      const categoryName = menu.dishCategory || menu.dishType || '';
      const items = grouped.get(categoryName) ?? [];
      items.push(new MenuItem(menu.dishName, ''));
      grouped.set(categoryName, items);
    }

    return Array.from(grouped.entries()).map(
      ([categoryName, items]) => new MenuGroup(categoryName, items),
    );
  }

  private toRestaurant(cafeteria: Cafeteria): Restaurant {
    const campus = new Campus(cafeteria.campus.id, cafeteria.campus.name, cafeteria.thumbnailUrl);
    return new Restaurant(
      cafeteria.id,
      cafeteria.campus.id,
      cafeteria.name,
      cafeteria.thumbnailUrl,
      campus,
    );
  }
}
