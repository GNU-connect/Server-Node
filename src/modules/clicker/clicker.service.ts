import { Injectable } from '@nestjs/common';
import { ClickerRepository } from './repository/clicker.repository';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import {
  createListCard,
  createSimpleImage,
  createSimpleText,
} from 'src/common/utils/component';

@Injectable()
export class ClickerService {
  constructor(private readonly clickerRepository: ClickerRepository) {}

  async getReadingRoomListCard(
    campusId: number,
    blockId: string,
  ): Promise<any> {
    if (campusId === 4) {
      return {
        outputs: [
          createSimpleText('해당 캠퍼스에는 열람실 정보가 존재하지 않아!'),
        ],
      };
    }

    const readingRoomEntities = await this.clickerRepository.findByCampusId(
      campusId,
    );

    if (readingRoomEntities.length === 0) {
      return {
        outputs: [createSimpleText('해당 캠퍼스는 업데이트 준비중이야!')],
      };
    }

    const header: ListItem = {
      title: '열람실 선택',
    };

    const items: ListItem[] = readingRoomEntities.map((readingRoomEntity) => {
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

    const campusListCard: ListCard = createListCard(header, items);

    return {
      outputs: [campusListCard],
    };
  }

  async getReadingRoomDetailCard(readingRoomId: number): Promise<any> {
    const imageUrl = `https://zppxqcdwhqqzbwpmcjjt.supabase.co/storage/v1/object/public/clicker/clicker/${readingRoomId}.png`;
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
