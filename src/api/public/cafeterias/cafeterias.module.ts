import { Module } from '@nestjs/common';
import { CafeteriaMessagesService } from 'src/api/public/cafeterias/cafeteria-messages.service';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { CafeteriasRepositoryModule } from 'src/type-orm/entities/cafeterias/cafeterias-repository.module';
import { CafeteriasController } from './cafeterias.controller';
import { CafeteriasService } from './cafeterias.service';

@Module({
  imports: [CampusesModule, CafeteriasRepositoryModule],
  controllers: [CafeteriasController],
  providers: [CafeteriasService, CafeteriaMessagesService],
})
export class CafeteriasModule {}
