import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesModule } from 'src/api/public/message-templates/messages.module';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import { CampusesRepository } from 'src/type-orm/entities/campuses/campuses.repository';
import { CampusesService } from './campuses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campus]), MessagesModule],
  providers: [CampusesService, CampusesRepository],
  exports: [CampusesService],
})
export class CampusesModule {}
