import { Module } from '@nestjs/common';
import { CafeteriaMessageFactory } from 'src/api/public/cafeterias/cafeteria-message.factory';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CampusMessageFactory } from 'src/api/public/campuses/campus-message.factory';
import { CafeteriasRepositoryModule } from 'src/type-orm/entities/cafeterias/cafeterias-repository.module';
import { CafeteriasNativeController } from './cafeterias-native.controller';
import { CafeteriasController } from './cafeterias.controller';
import { CafeteriasService } from './cafeterias.service';

@Module({
  imports: [CampusesModule, CafeteriasRepositoryModule],
  controllers: [CafeteriasController, CafeteriasNativeController],
  providers: [CafeteriasService, CafeteriaMessageFactory, CampusMessageFactory],
  exports: [CafeteriasService],
})
export class CafeteriasModule {}
