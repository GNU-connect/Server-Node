import { Injectable } from '@nestjs/common';
import { CampusesService } from 'src/campuses/campuses.service';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { BlockId } from 'src/common/utils/constants';
import { ReadingRoomMessagesService } from 'src/message-templates/reading-room-messages.service';
import { GetReadingRoomDetailRequestDto } from 'src/reading-rooms/dtos/request/get-reading-room-detail-request.dto';
import { ListReadingRoomsRequestDto } from 'src/reading-rooms/dtos/request/list-reading-rooms-request.dto';
import { ReadingRoom } from 'src/reading-rooms/entities/reading-rooms.entity';
import { ReadingRoomsRepository } from './repositories/reading-rooms.repository';
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
