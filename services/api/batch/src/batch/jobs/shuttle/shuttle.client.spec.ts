import { FetchHttpClient } from '../../http/fetch-http.client';
import { ShuttleClient } from './shuttle.client';

describe('ShuttleClient', () => {
  it('공통 HTTP 클라이언트에서 셔틀 HTML을 가져온다', async () => {
    const httpClient = {
      getText: jest.fn().mockResolvedValue('<html></html>'),
    } as unknown as FetchHttpClient;
    const client = new ShuttleClient(httpClient);

    await expect(client.fetch()).resolves.toBe('<html></html>');
    expect(httpClient.getText).toHaveBeenCalledTimes(1);
  });
});
