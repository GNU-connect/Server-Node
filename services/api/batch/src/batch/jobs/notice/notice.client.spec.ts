import { FetchHttpClient } from '../../http/fetch-http.client';
import { NoticeClient } from './notice.client';

describe('NoticeClient', () => {
  const getText = jest.fn().mockResolvedValue('<html></html>');
  const client = new NoticeClient({ getText } as unknown as FetchHttpClient);

  beforeEach(() => getText.mockClear());

  it('학교 공지 게시판 URL을 만들어 요청한다', async () => {
    await client.fetch({ mi: 1127, bbsId: 1029 });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/main/na/ntt/selectNttList.do?mi=1127&bbsId=1029',
    );
  });

  it('학과 사이트를 지정하면 그 사이트의 게시판을 요청한다', async () => {
    await client.fetch({ mi: 2, bbsId: 3 }, 'inmun');

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/inmun/na/ntt/selectNttList.do?mi=2&bbsId=3',
    );
  });
});
