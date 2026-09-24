export interface RetryOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  retryOnStatuses?: number[];
}

export interface HttpRequestOptions extends RequestInit {
  retry?: RetryOptions;
}

export interface HttpClient {
  request(url: string, options?: HttpRequestOptions): Promise<Response>;
  getText(url: string, options?: HttpRequestOptions): Promise<string>;
}
