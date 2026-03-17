import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingRoom } from './reading-rooms.entity';

@Injectable()
export class ReadingRoomsRepository {
  constructor(
    @InjectRepository(ReadingRoom)
    private readonly readingRoomRepository: Repository<ReadingRoom>,
  ) {}

  findAll(campusId: number): Promise<ReadingRoom[]> {
    return this.readingRoomRepository.find({
      where: {
        campus: {
          id: campusId,
        },
        isActive: true,
      },
    });
  }
}
