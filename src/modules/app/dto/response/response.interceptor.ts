import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { SkillResponse } from 'src/common/interfaces/response';

import { Injectable } from '@nestjs/common';
import { map } from 'rxjs';

// Re-format all non-error response to fit Kakao Chatbot API response format
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SkillResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SkillResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        version: '2.0',
        template: {
          outputs: [
            {
              simpleText: {
                text: data,
              },
            },
          ],
        },
      })),
    );
  }
}
