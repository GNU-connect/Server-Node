import { SetMetadata } from '@nestjs/common';

interface CacheOptions {
  key: string;
  ttl: number;
}

export const CACHEABLE_KEY = 'cacheable';
export const Cacheable = (options: CacheOptions) =>
  SetMetadata(CACHEABLE_KEY, options);
