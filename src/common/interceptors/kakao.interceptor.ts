import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Observable, map } from 'rxjs';

export class KakaoInterceptor implements NestInterceptor {
  constructor(private dto: any, private excludePaths: string[] = []) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // 제외 경로에 해당하는 경우 인터셉터를 건너뜁니다
    if (this.excludePaths.some((excludePath) => path.includes(excludePath))) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: any) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
