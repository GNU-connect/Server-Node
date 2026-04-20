import { Injectable } from '@nestjs/common';
import { Button, ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard, createTextCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import { ShuttleTimetable } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.entity';

type TimetableJson = Record<string, string[]>;

@Injectable()
export class ShuttleMessagesService {
  public createRoutesListCard(routes: ShuttleTimetable[]): SkillTemplate {
    const title = '🚌 셔틀버스 노선 선택';

    if (routes.length === 0) {
      return {
        outputs: [createTextCard(title, '현재 등록된 노선이 없습니다.')],
      };
    }

    const header: ListItem = { title };

    const items: ListItem[] = routes.map((route) => ({
      title: route.routeName,
      action: 'block',
      blockId: BlockId.SHUTTLE_TIMETABLE,
      extra: { routeName: route.routeName },
    }));

    return {
      outputs: [createListCard(header, items)],
    };
  }

  public createTimetableTextCard(record: ShuttleTimetable): SkillTemplate {
    const timetable = record.timetable as TimetableJson;
    const updatedAt = record.updatedAt;

    const descLines: string[] = [];

    for (const [section, times] of Object.entries(timetable)) {
      descLines.push(`[${section}]`);
      for (const time of times) {
        descLines.push(time.replace(/\(금요일 미운행\)/, '❌ 금요일 미운행'));
      }
      descLines.push('');
    }

    const formattedDate = updatedAt.toISOString().slice(0, 16).replace('T', ' ');
    descLines.push(`ℹ️ 시간표 업데이트: ${formattedDate}`);

    const buttons: Button[] = [
      {
        label: '뒤로 가기',
        action: 'block',
        blockId: BlockId.SHUTTLE_ROUTES,
      },
      {
        label: '공식 홈페이지',
        action: 'webLink',
        webLinkUrl:
          'https://www.gnu.ac.kr/main/cm/cntnts/cntntsView.do?mi=1358&cntntsId=1194',
      },
    ];

    return {
      outputs: [
        createTextCard(`🚌 ${record.routeName} 셔틀`, descLines.join('\n'), buttons),
      ],
    };
  }
}
