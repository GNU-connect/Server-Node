import { Injectable } from '@nestjs/common';
import { Button, ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard, createTextCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import { ShuttleRouteListResult } from 'src/api/public/shuttles/application/dtos/results/shuttle-route-list-result.dto';
import { ShuttleTimetableResult } from 'src/api/public/shuttles/application/dtos/results/shuttle-timetable-result.dto';

@Injectable()
export class ShuttleMessageFactory {
  public createRoutesListCard(result: ShuttleRouteListResult): SkillTemplate {
    const title = '🚌 셔틀버스 노선 선택';

    if (result.routes.length === 0) {
      return {
        outputs: [createTextCard(title, '현재 등록된 노선이 없습니다.')],
      };
    }

    const header: ListItem = { title };

    const items: ListItem[] = result.routes.map(route => ({
      title: route.routeName,
      action: 'block',
      blockId: BlockId.SHUTTLE_TIMETABLE,
      extra: { routeName: route.routeName },
    }));

    return {
      outputs: [createListCard(header, items)],
    };
  }

  public createTimetableTextCard(result: ShuttleTimetableResult): SkillTemplate {
    const descLines: string[] = [];

    for (const [section, times] of Object.entries(result.timetable)) {
      descLines.push(`[${section}]`);
      for (const time of times) {
        descLines.push(time.replace(/\(금요일 미운행\)/, '❌ 금요일 미운행'));
      }
      descLines.push('');
    }

    const formattedDate = result.updatedAt.toISOString().slice(0, 16).replace('T', ' ');
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
        webLinkUrl: 'https://www.gnu.ac.kr/main/cm/cntnts/cntntsView.do?mi=1358&cntntsId=1194',
      },
    ];

    return {
      outputs: [createTextCard(`🚌 ${result.routeName} 셔틀`, descLines.join('\n'), buttons)],
    };
  }
}
