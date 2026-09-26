import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { ParsedAcademicSchedule } from './type/parsed-academic-schedule';

const SCHEDULE_HREF_PATTERN =
  /viewSchdulInfo\('[^']*',\s*'(\d{4}\/\d{2}\/\d{2})',\s*'(\d{4}\/\d{2}\/\d{2})'/;
const LABEL_PATTERN = /^\[([^\]]*)\]\s*([\s\S]*)$/;

@Injectable()
export class AcademicCalendarParser {
  /** selectSchdulList.do 응답(JSON 문자열로 감싼 HTML)을 일정 목록으로 바꾼다. */
  parse(raw: string): ParsedAcademicSchedule[] {
    const html: unknown = JSON.parse(raw);
    if (typeof html !== 'string') {
      throw new Error('학사일정 응답 형식이 올바르지 않습니다.');
    }

    const $ = cheerio.load(html);
    const schedules: ParsedAcademicSchedule[] = [];

    $('a').each((_, anchor) => {
      const href = $(anchor).attr('href') ?? '';
      const dates = SCHEDULE_HREF_PATTERN.exec(href);
      const label = LABEL_PATTERN.exec($(anchor).text().trim());
      if (!dates || !label) return;

      const content = label[2].trim();
      if (!content) return;

      schedules.push({
        calendarType: label[1].trim() === '학부' ? 1 : 2,
        startDate: dates[1].replaceAll('/', '-'),
        endDate: dates[2].replaceAll('/', '-'),
        content,
      });
    });

    return schedules;
  }
}
