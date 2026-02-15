import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { ScheduleMessagesService } from 'src/api/public/message-templates/schedule-messages.service';
import { AcademicCalendarsRepository } from 'src/type-orm/entities/academic-calendars/academic-calendars.repository';
import { CommonMessagesService } from '../message-templates/common-messages.service';

@Injectable()
export class SchedulesService {
  // 학부생 calendar_type
  private readonly UNDERGRADUATE_CALENDAR_TYPE = 1;

  constructor(
    private readonly academicCalendarsRepository: AcademicCalendarsRepository,
    private readonly scheduleMessagesService: ScheduleMessagesService,
    private readonly commonMessagesService: CommonMessagesService,
  ) {}

  /**
   * 학사일정 템플릿 생성
   * @param month 조회할 월 (선택사항, 기본값: 현재 월)
   * @returns SkillTemplate
   */
  async getAcademicScheduleTemplate(month?: number): Promise<SkillTemplate> {
    const now = new Date();
    const year = now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // 월 유효성 검사
    if (targetMonth < 1 || targetMonth > 12) {
      return this.commonMessagesService.createSimpleText(
        '올바른 월을 입력해주세요. (1-12)',
      );
    }

    // 학사일정 조회
    const schedules =
      await this.academicCalendarsRepository.findByYearAndMonth(
        year,
        targetMonth,
        this.UNDERGRADUATE_CALENDAR_TYPE,
      );

    // TextCard 응답 생성
    return this.scheduleMessagesService.createAcademicScheduleTextCard(
      year,
      targetMonth,
      schedules,
    );
  }
}
