import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CafeteriaMessageFactory } from 'src/api/public/cafeterias/cafeteria-message.factory';
import { CafeteriasRepository } from 'src/api/public/cafeterias/cafeterias.repository';
import { CafeteriaDiet } from 'src/api/public/cafeterias/entities/cafeteria-diet.entity';
import { Cafeteria } from 'src/api/public/cafeterias/entities/cafeteria.entity';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CampusMessageFactory } from 'src/api/public/campuses/campus-message.factory';
import { CafeteriasNativeController } from './cafeterias-native.controller';
import { CafeteriasController } from './cafeterias.controller';
import { CafeteriasService } from './cafeterias.service';

@Module({
  imports: [CampusesModule, TypeOrmModule.forFeature([Cafeteria, CafeteriaDiet])],
  controllers: [CafeteriasController, CafeteriasNativeController],
  providers: [
    CafeteriasService,
    CafeteriasRepository,
    CafeteriaMessageFactory,
    CampusMessageFactory,
  ],
  exports: [CafeteriasService],
})
export class CafeteriasModule {}
