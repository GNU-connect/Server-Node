import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
      switchMap(async (data) => {
        await this.redisService.set(cacheKey, data, cacheOptions.ttl);
        return data;
      }),
    );
  }

  private generateCacheKey(request: any, baseKey: string): string {
    const body = request.body || {};
    const clientExtra = body?.action?.clientExtra || {};

    // clientExtra의 모든 키-값 쌍을 정렬된 배열로 변환
    const extraValues = Object.entries(clientExtra)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, value]) => value)
      .filter((value) => value !== undefined && value !== null);

    return extraValues.length > 0
      ? `${baseKey}:${extraValues.join(':')}`
      : baseKey;
  }
}
