import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';
import type { Cafeteria } from './domain/cafeteria.entity';

@Injectable()
export class CafeteriaClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  async fetch(
    cafeteria: Pick<Cafeteria, 'type' | 'restSeq' | 'mi' | 'schSysId'>,
  ): Promise<string> {
    const { type, restSeq, mi, schSysId } = cafeteria;
    let url = `https://www.gnu.ac.kr/${type}/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=${restSeq}&mi=${mi}`;
    if (schSysId) url += `&schSysId=${schSysId}`;

    return this.httpClient.getText(url);
  }
}
