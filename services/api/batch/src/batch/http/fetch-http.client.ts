import { Injectable } from '@nestjs/common';
import {
  HttpClient,
  HttpRequestOptions,
  RetryOptions,
} from './http-client.interface';
import { delay } from '../utils/delay';
import { HttpRequestError } from './error/http-request.error';

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRY_ON_STATUSES = [429, 500, 502, 503, 504];

@Injectable()
export class FetchHttpClient implements HttpClient {
  async request(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<Response> {
    const retryOptions = this.getRetryOptions(options.retry);
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryOptions.retries; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          options,
          retryOptions.timeoutMs,
        );

        if (response.ok) {
          return response;
        }

        if (
          !this.shouldRetryStatus(response.status, retryOptions) ||
          attempt === retryOptions.retries
        ) {
          throw new HttpRequestError(
            `HTTP request failed with status ${response.status}`,
            response.status,
          );
        }

        lastError = new HttpRequestError(
          `HTTP request failed with status ${response.status}`,
          response.status,
        );
      } catch (error) {
        lastError = error;

        if (!this.shouldRetryError(error) || attempt === retryOptions.retries) {
          throw this.toHttpRequestError(error);
        }
      }

      await delay(retryOptions.retryDelayMs);
    }

    throw this.toHttpRequestError(lastError);
  }

  async getText(url: string, options?: HttpRequestOptions): Promise<string> {
    const response = await this.request(url, options);

    return response.text();
  }

  private async fetchWithTimeout(
    url: string,
    options: HttpRequestOptions,
    timeoutMs: number,
  ): Promise<Response> {
    const { retry: _retry, signal, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const abortListener = () => controller.abort();
    signal?.addEventListener('abort', abortListener, { once: true });

    try {
      return await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortListener);
    }
  }

  private getRetryOptions(retry?: RetryOptions): Required<RetryOptions> {
    return {
      retries: retry?.retries ?? DEFAULT_RETRIES,
      retryDelayMs: retry?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      timeoutMs: retry?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retryOnStatuses: retry?.retryOnStatuses ?? DEFAULT_RETRY_ON_STATUSES,
    };
  }

  private shouldRetryStatus(
    status: number,
    retryOptions: Required<RetryOptions>,
  ): boolean {
    return retryOptions.retryOnStatuses.includes(status);
  }

  private shouldRetryError(error: unknown): boolean {
    return !(error instanceof HttpRequestError && error.status !== undefined);
  }

  private toHttpRequestError(error: unknown): HttpRequestError {
    if (error instanceof HttpRequestError) {
      return error;
    }

    if (error instanceof Error) {
      return new HttpRequestError(error.message, undefined, error);
    }

    return new HttpRequestError('HTTP request failed', undefined, error);
  }
}
