import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusesModule } from 'src/api/public/campuses/campuses.module';
import { MessagesModule } from 'src/api/public/message-templates/messages.module';
import { DatabaseModule } from '../../../type-orm/database.module';
import { ReadingRoom } from '../../../type-orm/entities/reading-rooms/reading-rooms.entity';
import { ReadingRoomsRepository } from '../../../type-orm/entities/reading-rooms/reading-rooms.repository';
import { ReadingRoomsController } from './reading-rooms.controller';
import { ReadingRoomsService } from './reading-rooms.service';
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
