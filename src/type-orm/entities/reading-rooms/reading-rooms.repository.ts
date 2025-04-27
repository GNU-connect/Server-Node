import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListReadingRoomsRequestDto } from 'src/api/public/reading-rooms/dtos/request/list-reading-rooms-request.dto';
import { Repository } from 'typeorm';
import { ReadingRoom } from './reading-rooms.entity';

@Injectable()
export class ReadingRoomsRepository {
  constructor(
    @InjectRepository(ReadingRoom)
    private readonly readingRoomRepository: Repository<ReadingRoom>,
  ) {}

  async findAll(extra: ListReadingRoomsRequestDto): Promise<ReadingRoom[]> {
    return await this.readingRoomRepository.find({
      where: {
        campusId: extra.campusId,
        isActive: true,
      },
    });
  }
}
