import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';

const SCHEDULE_LIST_URL =
  'https://www.gnu.ac.kr/main/ps/schdul/selectSchdulList.do?mi=1084';
const MENU_ID = '1084';

@Injectable()
export class AcademicCalendarClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  /**
   * 학사일정 페이지가 표를 채울 때 부르는 AJAX 엔드포인트를 직접 호출한다.
   * 메인 페이지를 GET하면 빈 컨테이너만 오고 데이터는 이 응답에 있다.
   */
  async fetchYear(year: number): Promise<string> {
    const body = new URLSearchParams({
      schdulLevel: 'Y',
      srchYear: String(year),
      menuId: MENU_ID,
      sysId: 'main',
    });

    return this.httpClient.getText(SCHEDULE_LIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  }
}
