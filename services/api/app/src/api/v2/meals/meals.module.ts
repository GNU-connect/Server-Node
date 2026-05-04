import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusMessageFactory } from 'src/api/public/campuses/campus-message.factory';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { DateMealSelectionPolicy } from './domain/date-meal-selection-policy.domain';
import { MealsKakaoController } from './controller/kakao/meals.controller';
import { MealsMessageFactory } from './controller/kakao/meals-message.factory';
import { MealsNativeController } from './controller/native/meals.controller';
import { MealsRepository } from './repository/meals.repository';
import { MealsService } from './service/meals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cafeteria, CafeteriaDiet]), CampusesModule],
  controllers: [MealsKakaoController, MealsNativeController],
  providers: [
    MealsService,
    MealsRepository,
    DateMealSelectionPolicy,
    MealsMessageFactory,
    CampusMessageFactory,
  ],
  exports: [MealsService],
})
export class MealsModule {}
