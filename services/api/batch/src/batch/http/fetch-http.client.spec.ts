import { FetchHttpClient } from './fetch-http.client';
import { HttpRequestError } from './error/http-request.error';

describe('FetchHttpClient', () => {
  let client: FetchHttpClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new FetchHttpClient();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('성공 응답은 재시도 없이 반환한다', async () => {
    fetchMock.mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const response = await client.request('https://example.com', {
      retry: { retryDelayMs: 0 },
    });

    await expect(response.text()).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('네트워크 오류가 발생하면 재시도한다', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const text = await client.getText('https://example.com', {
      retry: { retries: 1, retryDelayMs: 0 },
    });

    expect(text).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('500 응답은 재시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const text = await client.getText('https://example.com', {
      retry: { retries: 1, retryDelayMs: 0 },
    });

    expect(text).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('429 응답은 재시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const text = await client.getText('https://example.com', {
      retry: { retries: 1, retryDelayMs: 0 },
    });

    expect(text).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('404 응답은 재시도하지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404 }));

    await expect(
      client.request('https://example.com', {
        retry: { retries: 3, retryDelayMs: 0 },
      }),
    ).rejects.toThrow(HttpRequestError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
