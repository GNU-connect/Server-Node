import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../common/database/database.module';
import { ReadingRoom } from './entities/reading-rooms.entity';
import { ReadingRoomsController } from './reading-rooms.controller';
import { ReadingRoomsService } from './reading-rooms.service';
import { ReadingRoomsRepository } from './repositories/reading-rooms.repository';
import { CampusesModule } from 'src/campuses/campuses.module';
import { MessagesModule } from 'src/message-templates/messages.module';
@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([ReadingRoom]),
    CampusesModule,
    MessagesModule,
  ],
  controllers: [ReadingRoomsController],
  providers: [ReadingRoomsService, ReadingRoomsRepository],
})
export class ReadingRoomsModule {}
