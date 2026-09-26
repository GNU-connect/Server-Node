import { FetchHttpClient } from '../../http/fetch-http.client';
import { AcademicCalendarClient } from './academic-calendar.client';

describe('AcademicCalendarClient', () => {
  it('연도를 form 바디에 담아 학사일정 목록을 POST로 요청한다', async () => {
    const getText = jest
      .fn<
        Promise<string>,
        [
          string,
          {
            method: string;
            headers: Record<string, string>;
            body: URLSearchParams;
          },
        ]
      >()
      .mockResolvedValue('"<div></div>"');
    const client = new AcademicCalendarClient({
      getText,
    } as unknown as FetchHttpClient);

    await expect(client.fetchYear(2027)).resolves.toBe('"<div></div>"');

    const [url, options] = getText.mock.calls[0];
    expect(url).toBe(
      'https://www.gnu.ac.kr/main/ps/schdul/selectSchdulList.do?mi=1084',
    );
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(String(options.body)).toBe(
      'schdulLevel=Y&srchYear=2027&menuId=1084&sysId=main',
    );
  });
});
