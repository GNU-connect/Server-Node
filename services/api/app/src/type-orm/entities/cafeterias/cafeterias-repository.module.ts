import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';
import { Cafeteria } from './cafeteria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cafeteria, CafeteriaDiet])],
  providers: [CafeteriasRepository],
  exports: [CafeteriasRepository],
})
export class CafeteriasRepositoryModule {}
