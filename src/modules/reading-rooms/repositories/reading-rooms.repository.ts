import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingRoom } from '../entities/reading-rooms.entity';

@Injectable()
export class ReadingRoomsRepository {
  constructor(
    @InjectRepository(ReadingRoom)
    private readonly readingRoomRepository: Repository<ReadingRoom>,
  ) {}

  async findReadingRoomsByCampusId(campusId: number): Promise<ReadingRoom[]> {
    return await this.readingRoomRepository.find({
      where: {
        campusId: campusId,
        isActive: true,
      },
    });
  }
}
