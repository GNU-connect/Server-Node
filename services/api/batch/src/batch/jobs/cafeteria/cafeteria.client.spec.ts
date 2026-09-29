import { FetchHttpClient } from '../../http/fetch-http.client';
import { CafeteriaClient } from './cafeteria.client';

describe('CafeteriaClient', () => {
  const getText = jest.fn().mockResolvedValue('<html></html>');
  const client = new CafeteriaClient({ getText } as unknown as FetchHttpClient);

  beforeEach(() => getText.mockClear());

  it('식당 정보로 식단 URL을 만들어 요청한다', async () => {
    await client.fetch({ type: 'dorm', restSeq: 47, mi: 7278, schSysId: null });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/dorm/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=47&mi=7278',
    );
  });

  it('schSysId가 있으면 쿼리에 붙인다', async () => {
    await client.fetch({ type: 'main', restSeq: 3, mi: 100, schSysId: 'hs' });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/main/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=3&mi=100&schSysId=hs',
    );
  });

  it('schSysId가 빈 문자열이면 붙이지 않는다', async () => {
    await client.fetch({ type: 'dorm', restSeq: 47, mi: 7278, schSysId: '' });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/dorm/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=47&mi=7278',
    );
  });
});
