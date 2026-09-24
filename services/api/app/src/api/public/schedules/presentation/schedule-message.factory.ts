import { Injectable } from '@nestjs/common';
import { TextCard } from 'src/api/common/interfaces/response/fields/component';
import { Button, QuickReply } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createTextCard } from 'src/api/common/utils/component';
import { KakaoBlockId } from 'src/api/common/presentation/kakao.constants';
import { AcademicScheduleResult } from 'src/api/public/schedules/application/dtos/results/academic-schedule-result.dto';

@Injectable()
export class ScheduleMessageFactory {
  /**
   * 학사일정 TextCard 생성
   * @param year 년도
   * @param month 월
   * @param schedules 학사일정 목록
   * @returns SkillTemplate
   */
  createAcademicScheduleTextCard(result: AcademicScheduleResult): SkillTemplate {
    const title = `${result.year}년 ${result.month}월 학사일정`;

    // 학사일정 내용 생성
    let description = '';
    if (result.schedules.length === 0) {
      description = '등록된 학사일정이 없습니다.';
    } else {
      description = result.schedules
        .map(schedule => {
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);

          const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
          const startDay = String(startDate.getDate()).padStart(2, '0');
          const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
          const endDay = String(endDate.getDate()).padStart(2, '0');

          return `[${startMonth}/${startDay} ~ ${endMonth}/${endDay}]\n🗓️ ${schedule.content}`;
        })
        .join('\n\n');
    }

    // 더보기 버튼
    const buttons: Button[] = [
      {
        label: '더보기',
        action: 'webLink',
        webLinkUrl: 'https://www.gnu.ac.kr/main/ps/schdul/selectSchdulMainList.do?mi=1084',
      },
    ];

    const textCard: TextCard = createTextCard(title, description, buttons);

    // Quick Replies 생성
    const quickReplies = this.createMonthQuickReplies(result.month);

    return {
      outputs: [textCard],
      quickReplies,
    };
  }

  /**
   * 월 선택 Quick Replies 생성
   * @param currentMonth 현재 선택된 월
   * @returns QuickReply 배열
   */
  private createMonthQuickReplies(currentMonth: number): QuickReply[] {
    // n월을 선택하면 n+1월 ~ 12월까지 표시
    // 12월을 선택하면 1월 ~ 12월까지 표시 (순환)
    const startMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const endMonth = 12;

    const replies: QuickReply[] = [];

    for (let month = startMonth; month <= endMonth; month++) {
      replies.push({
        label: `${month}월`,
        action: 'block',
        blockId: KakaoBlockId.ACADEMIC_SCHEDULE,
        extra: { month },
      });
    }

    return replies;
  }
}
