import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type {
  ParsedCafeteriaDish,
  ParsedCafeteriaMenu,
} from './type/parsed-cafeteria-menu';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MEAL_TIMES = ['아침', '점심', '저녁'];
const DISH_TYPES = ['주식', '국류', '찬류', '후식'];
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;
const LUNCH_ONLY_CAFETERIA = '교육문화식당';
const TYPED_FORM = 2;

export interface CafeteriaLayout {
  name: string;
  formType: number | null;
}

interface Slot {
  date: string;
  day: string;
  time: string;
  dishType: string | null;
}

@Injectable()
export class CafeteriaParser {
  parse(raw: string, layout: CafeteriaLayout): ParsedCafeteriaMenu {
    const $ = cheerio.load(raw);

    // 첫 번째 th는 "구분" 열이다. 날짜를 못 읽은 열은 undefined로 남겨 열 위치를 유지한다.
    const dates = $('thead th')
      .toArray()
      .slice(1)
      .map((th) => DATE_PATTERN.exec($(th).text())?.[0]);
    const rows = $('tbody > tr').toArray();
    const knownDates = dates
      .filter((date): date is string => date !== undefined)
      .sort();

    if (knownDates.length === 0 || rows.length === 0) {
      throw new Error('식단 표를 찾을 수 없습니다.');
    }

    const isTyped = layout.formType === TYPED_FORM;
    const isLunchOnly = isTyped || layout.name === LUNCH_ONLY_CAFETERIA;
    const slotCount = Math.min(
      rows.length,
      isTyped ? DISH_TYPES.length : MEAL_TIMES.length,
    );
    const dishes: ParsedCafeteriaDish[] = [];

    for (let index = 0; index < slotCount; index += 1) {
      const dishType = isTyped ? DISH_TYPES[index] : null;
      const time = isLunchOnly ? '점심' : MEAL_TIMES[index];
      const cells = $(rows[index]).children('td').toArray();

      DAYS.forEach((day, dayIndex) => {
        const cellNode = cells[dayIndex];
        const date = dates[dayIndex];
        if (!cellNode || !date) return;
        dishes.push(
          ...this.parseCell($, cellNode, { date, day, time, dishType }),
        );
      });
    }

    return {
      startDate: knownDates[0],
      endDate: knownDates[knownDates.length - 1],
      dishes,
    };
  }

  private parseCell(
    $: cheerio.CheerioAPI,
    cell: AnyNode,
    slot: Slot,
  ): ParsedCafeteriaDish[] {
    const dishes: ParsedCafeteriaDish[] = [];
    // 카테고리 제목이 없는 칸은 앞에서 읽은 카테고리를 이어 쓴다.
    let dishCategory: string | null = null;

    $(cell)
      .find('div')
      .each((_, div) => {
        const header = $(div).find('p.mgt15').first();
        if (header.length > 0) dishCategory = header.text().trim();

        const menu = $(div)
          .find('p')
          .filter((__, p) => !$(p).attr('class'))
          .first();

        for (const dishName of this.splitMenu($, menu)) {
          dishes.push({ ...slot, dishCategory, dishName });
        }
      });

    return dishes;
  }

  /** <br>을 기준으로 메뉴 이름을 나누고 빈 항목은 버린다. */
  private splitMenu(
    $: cheerio.CheerioAPI,
    menu: cheerio.Cheerio<AnyNode>,
  ): string[] {
    const items: string[] = [];
    let buffer = '';
    const flush = () => {
      const name = buffer.trim();
      if (name) items.push(name);
      buffer = '';
    };

    menu.contents().each((_, node) => {
      if ('name' in node && node.name === 'br') flush();
      else buffer += $(node).text();
    });
    flush();

    return items;
  }
}
