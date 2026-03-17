import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

function normalizePath(path: string): string {
  return path
    .replace(/^\/api/, '')
    .replace(/\/[0-9a-f-]{36}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/^\/?/, '/api/')
    .replace(/\/$/, '') || '/api';
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_errors_total')
    private readonly httpErrorsTotal: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    if (request.path === '/api/metrics' || request.path === '/api/health') {
      return next.handle();
    }

    const start = Date.now();
    const path = normalizePath(request.path);
    const method = request.method;

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(context, path, method, start, false);
        },
        error: () => {
          this.recordMetrics(context, path, method, start, true);
        },
      }),
    );
  }

  private recordMetrics(
    context: ExecutionContext,
    path: string,
    method: string,
    start: number,
    isError: boolean,
  ): void {
    const response = context.switchToHttp().getResponse();
    const status = isError ? 500 : (response.statusCode || 200);
    const durationSeconds = (Date.now() - start) / 1000;

    const labels = {
      method,
      path,
      status: String(status),
    };

    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestsTotal.inc(labels);

    if (isError || status >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }
}
