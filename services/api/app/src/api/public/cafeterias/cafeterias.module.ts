import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CafeteriaMessageFactory } from 'src/api/public/cafeterias/presentation/cafeteria-message.factory';
import { CafeteriasRepository } from 'src/api/public/cafeterias/infrastructure/cafeterias.repository';
import { CafeteriaDiet } from 'src/api/public/cafeterias/domain/entities/cafeteria-diet.entity';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CampusMessageFactory } from 'src/api/public/campuses/presentation/campus-message.factory';
import { CafeteriasNativeController } from 'src/api/public/cafeterias/presentation/cafeterias-native.controller';
import { CafeteriasController } from 'src/api/public/cafeterias/presentation/cafeterias.controller';
import { CafeteriasService } from 'src/api/public/cafeterias/application/cafeterias.service';

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
