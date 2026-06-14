import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';

const SHUTTLE_TIMETABLE_URL =
  'https://www.gnu.ac.kr/main/cm/cntnts/cntntsView.do?mi=1358&cntntsId=1194';

@Injectable()
export class ShuttleClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  async fetch(): Promise<string> {
    return this.httpClient.getText(SHUTTLE_TIMETABLE_URL);
  }
}
