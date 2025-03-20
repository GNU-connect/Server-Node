import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';
import { ReadingRoom } from './entities/reading-rooms.entity';
import { ReadingRoomsController } from './reading-rooms.controller';
import { ReadingRoomsService } from './reading-rooms.service';
import { ReadingRoomsRepository } from './repositories/reading-rooms.repository';

@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([ReadingRoom]),
  ],
  controllers: [ReadingRoomsController],
  providers: [ReadingRoomsService, ReadingRoomsRepository],
})
export class ReadingRoomsModule {}
