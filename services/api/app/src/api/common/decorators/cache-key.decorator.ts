import { Cache } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';

export interface CacheKeyOptions {
  /** 메서드 인자를 받아 캐시 키를 반환하는 팩토리 함수 */
  key: (args: unknown[]) => string;
  /** TTL (밀리초). 미설정 시 캐시 모듈 기본값 사용 */
  ttl?: number;
}

/**
 * 메서드 반환값을 캐시하는 데코레이터.
 *
 * 요구사항: 적용 클래스에 `cacheManager: Cache` 프로퍼티가 DI로 주입되어 있어야 함.
 * `logger: Logger` 프로퍼티가 있으면 cache hit/miss 로그를 자동으로 기록함.
 */
export function CacheKey(options: CacheKeyOptions): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const cacheManager = (this as { cacheManager: Cache }).cacheManager;
      const logger = (this as { logger?: Logger }).logger;

      const cacheKey = options.key(args);
      const cached = await cacheManager.get(cacheKey);

      if (cached !== null && cached !== undefined) {
        logger?.log(`cache hit — key=${cacheKey}`);
        return cached;
      }

      logger?.log(`cache miss — key=${cacheKey}`);

      const result = await originalMethod.apply(this, args);
      if (options.ttl !== undefined) {
        await cacheManager.set(cacheKey, result, options.ttl);
      } else {
        await cacheManager.set(cacheKey, result);
      }
      return result;
    };

    return descriptor;
  };
}
