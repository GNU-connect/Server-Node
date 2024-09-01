import { Module } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { CafeteriaController } from './cafeteria.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CafeteriaNutritionalIngredientsEntity } from './entities/cafeteria_nutritional_ingredients.entity';
import { CafeteriaNutritionalIngredientsRepository } from './repository/cafeteria_nutritional_ingredients.repository';

@Module({
  imports: [
    SupabaseModule,
    TypeOrmModule.forFeature([CafeteriaNutritionalIngredientsEntity]),
  ],
  controllers: [CafeteriaController],
  providers: [CafeteriaService, CafeteriaNutritionalIngredientsRepository],
})
export class CafeteriaModule {}
