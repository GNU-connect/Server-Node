import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { ParsedNotice } from './type/parsed-notice';

const TEXT_NODE = 3;
const DATE_HEADER = '등록일';
const DATE_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})$/;

@Injectable()
export class NoticeParser {
  parse(raw: string): ParsedNotice[] {
    const $ = cheerio.load(raw);

    const headers = $('thead th')
      .toArray()
      .map((th) => $(th).text().trim());
    const dateIndex = headers.indexOf(DATE_HEADER);
    if (dateIndex === -1 || $('tbody').length === 0) {
      throw new Error('공지 목록 표를 찾을 수 없습니다.');
    }

    const notices = $('tbody > tr')
      .toArray()
      .map((row) => this.parseRow($, row, dateIndex))
      .filter((notice): notice is ParsedNotice => notice !== null);

    // 게시글이 없는 게시판은 정상이다. 링크는 있는데 하나도 못 읽었다면 구조가 바뀐 것이다.
    if (notices.length === 0 && $('a.nttInfoBtn').length > 0) {
      throw new Error('공지 목록 행을 해석할 수 없습니다.');
    }

    return notices;
  }

  private parseRow(
    $: cheerio.CheerioAPI,
    row: AnyNode,
    dateIndex: number,
  ): ParsedNotice | null {
    const anchor = $(row).find('a.nttInfoBtn').first();
    const nttSn = Number(anchor.attr('data-id'));
    const date = DATE_PATTERN.exec(
      $(row).children('td').eq(dateIndex).text().trim(),
    );
    const title = this.readTitle($, anchor);

    if (!Number.isInteger(nttSn) || nttSn <= 0 || !date || !title) return null;

    return { nttSn, title, createdAt: `${date[1]}-${date[2]}-${date[3]}` };
  }

  /** 링크 안의 텍스트 노드만 읽는다. "N" 같은 아이콘 태그의 글자는 제목이 아니다. */
  private readTitle(
    $: cheerio.CheerioAPI,
    anchor: cheerio.Cheerio<AnyNode>,
  ): string {
    return anchor
      .contents()
      .toArray()
      .filter((node) => node.nodeType === TEXT_NODE)
      .map((node) => $(node).text())
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
