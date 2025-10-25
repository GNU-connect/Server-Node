import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';
import { Cafeteria } from './cafeteria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cafeteria])],
  providers: [CafeteriasRepository],
  exports: [CafeteriasRepository],
})
export class CafeteriasRepositoryModule {}
