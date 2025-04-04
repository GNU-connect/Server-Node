import { Module } from '@nestjs/common';
import { CampusesService } from './campuses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campus } from 'src/campuses/entities/campus.entity';
import { CampusesRepository } from 'src/campuses/repositories/campuses.repository';
import { MessagesModule } from 'src/message-templates/messages.module';

@Module({
  imports: [TypeOrmModule.forFeature([Campus]), MessagesModule],
  providers: [CampusesService, CampusesRepository],
  exports: [CampusesService],
})
export class CampusesModule {}
