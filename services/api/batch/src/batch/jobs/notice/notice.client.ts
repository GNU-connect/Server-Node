import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';
import type { NoticeCategory } from './domain/notice-category.entity';

const UNIVERSITY_SITE = 'main';

@Injectable()
export class NoticeClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  /** 게시판 첫 페이지를 가져온다. site는 학교 공지면 main, 학과 공지면 학과 영문 이름이다. */
  async fetch(
    category: Pick<NoticeCategory, 'mi' | 'bbsId'>,
    site: string = UNIVERSITY_SITE,
  ): Promise<string> {
    return this.httpClient.getText(
      `https://www.gnu.ac.kr/${site}/na/ntt/selectNttList.do?mi=${category.mi}&bbsId=${category.bbsId}`,
    );
  }
}
