import { Logger } from '@nestjs/common';
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

  it('재시도가 결정되면 warn 로그를 남긴다', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    await client.getText('https://example.com', {
      retry: { retries: 1, retryDelayMs: 0 },
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('1/2번째 시도'),
      expect.any(Error),
    );
  });

  it('재시도할 때마다 시도 횟수가 증가한 warn 로그를 남긴다', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    fetchMock
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    await client.getText('https://example.com', {
      retry: { retries: 2, retryDelayMs: 0 },
    });

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('1/3번째 시도'),
      expect.any(Error),
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('2/3번째 시도'),
      expect.any(Error),
    );
  });

  it('마지막 시도가 실패해 재시도 없이 종료될 때는 warn 로그를 남기지 않는다', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    await expect(
      client.request('https://example.com', {
        retry: { retries: 0, retryDelayMs: 0 },
      }),
    ).rejects.toThrow(HttpRequestError);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('재시도 불가능한 에러는 warn 로그 없이 즉시 실패한다', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404 }));

    await expect(
      client.request('https://example.com', {
        retry: { retries: 3, retryDelayMs: 0 },
      }),
    ).rejects.toThrow(HttpRequestError);

    expect(warnSpy).not.toHaveBeenCalled();
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
