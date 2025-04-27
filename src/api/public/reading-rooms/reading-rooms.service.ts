import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { BlockId } from 'src/api/common/utils/constants';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { ReadingRoomMessagesService } from 'src/api/public/message-templates/reading-room-messages.service';
import { GetReadingRoomDetailRequestDto } from 'src/api/public/reading-rooms/dtos/request/get-reading-room-detail-request.dto';
import { ListReadingRoomsRequestDto } from 'src/api/public/reading-rooms/dtos/request/list-reading-rooms-request.dto';
import { ReadingRoom } from 'src/type-orm/entities/reading-rooms/reading-rooms.entity';
import { ReadingRoomsRepository } from 'src/type-orm/entities/reading-rooms/reading-rooms.repository';

@Injectable()
export class ReadingRoomsService {
  constructor(
    private readonly readingRoomsRepository: ReadingRoomsRepository,
    private readonly readingRoomMessagesService: ReadingRoomMessagesService,
    private readonly campusesService: CampusesService,
  ) {}

  public findAll(extra: ListReadingRoomsRequestDto): Promise<ReadingRoom[]> {
    return this.readingRoomsRepository.findAll(extra);
  }

  public async campusesListCard(): Promise<SkillTemplate> {
    const blockId = BlockId.READING_ROOM_LIST;
    return this.campusesService.campusesListCard(blockId);
  }

  public async readingRoomsListCard(
    extra: ListReadingRoomsRequestDto,
  ): Promise<SkillTemplate> {
    const blockId = BlockId.READING_ROOM_DETAIL;
    const readingRooms = await this.findAll(extra);
    return this.readingRoomMessagesService.readingRoomsListCard(
      readingRooms,
      extra.campusId,
      blockId,
    );
  }

  public async readingRoomDetailComplexCard(
    extra: GetReadingRoomDetailRequestDto,
  ): Promise<SkillTemplate> {
    return this.readingRoomMessagesService.readingRoomDetailComplexCard(extra);
  }
}
