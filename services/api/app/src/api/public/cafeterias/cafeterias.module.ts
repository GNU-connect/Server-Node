import { Module } from '@nestjs/common';
import { CafeteriaMessagesService } from 'src/api/public/cafeterias/cafeteria-messages.service';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CampusMessagesService } from 'src/api/public/campuses/campus-messages.service';
import { CafeteriasRepositoryModule } from 'src/type-orm/entities/cafeterias/cafeterias-repository.module';
import { CafeteriasNativeController } from './cafeterias-native.controller';
import { CafeteriasController } from './cafeterias.controller';
import { CafeteriasService } from './cafeterias.service';

@Module({
  imports: [CampusesModule, CafeteriasRepositoryModule],
  controllers: [CafeteriasController, CafeteriasNativeController],
  providers: [CafeteriasService, CafeteriaMessagesService, CampusMessagesService],
  exports: [CafeteriasService],
})
export class CafeteriasModule {}
