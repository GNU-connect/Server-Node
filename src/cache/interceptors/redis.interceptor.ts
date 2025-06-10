import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHEABLE_KEY } from 'src/cache/decorators/cache-key.decorator';
import { RedisService } from 'src/cache/redis.service';

@Injectable()
export class RedisInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheOptions = Reflect.getMetadata(
      CACHEABLE_KEY,
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request, cacheOptions.key);
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      return of(cachedData);
    }

    return next.handle().pipe(
      tap((data) => {
        this.redisService
          .set(cacheKey, data, cacheOptions.ttl)
          .catch((error) => {
            console.error('Redis cache set error:', error);
          });
        return data;
      }),
    );
  }

  private generateCacheKey(request: any, baseKey: string): string {
    const body = request.body || {};
    const clientExtra = body?.action?.clientExtra || {};

    const extraValues = Object.entries(clientExtra)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, value]) => value)
      .filter((value) => value !== undefined && value !== null);

    return extraValues.length > 0
      ? `${baseKey}:${extraValues.join(':')}`
      : baseKey;
  }
}
