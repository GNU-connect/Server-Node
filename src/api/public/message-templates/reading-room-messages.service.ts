import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import {
  createListCard,
  createSimpleImage,
  createSimpleText,
} from 'src/api/common/utils/component';
import { GetReadingRoomDetailRequestDto } from 'src/api/public/reading-rooms/dtos/request/get-reading-room-detail-request.dto';
import { ReadingRoom } from 'src/type-orm/entities/reading-rooms/reading-rooms.entity';

@Injectable()
export class ReadingRoomMessagesService {
  constructor(private readonly configService: ConfigService) {}

  public async readingRoomsListCard(
    readingRooms: ReadingRoom[],
    campusId: number,
    blockId: string,
  ): Promise<SkillTemplate> {
    if (campusId === 4) {
      return {
        outputs: [
          createSimpleText('해당 캠퍼스에는 열람실 정보가 존재하지 않아!'),
        ],
      };
    }

    if (!readingRooms.length) {
      return {
        outputs: [createSimpleText('해당 캠퍼스는 업데이트 준비중이야!')],
      };
    }

    const header: ListItem = {
      title: '열람실 선택',
    };

    const items: ListItem[] = readingRooms.map((readingRoomEntity) => {
      return {
        title: `[${readingRoomEntity.libraryName}] ${readingRoomEntity.roomName}`,
        description: `총 좌석 수: ${readingRoomEntity.totalSeats}석`,
        action: 'block',
        blockId,
        extra: {
          readingRoomId: readingRoomEntity.id,
        },
      };
    });

    const campusesListCard: ListCard = createListCard(header, items);

    return {
      outputs: [campusesListCard],
    };
  }

  public readingRoomDetailComplexCard(
    extra: GetReadingRoomDetailRequestDto,
  ): SkillTemplate {
    const baseUrl = this.configService.get<string>('DB_STORAGE_URL');
    const imageUrl = `${baseUrl}/clicker/clicker/${extra.readingRoomId}.png`;
    return {
      outputs: [
        createSimpleImage(imageUrl, '열람실 좌석 사진'),
        createSimpleText(`🟩: 사용 가능
🟪: 사용한 시간
🟦: 남은 시간
        
기본 3시간(최대 4회 연장가능)`),
      ],
    };
  }
}
