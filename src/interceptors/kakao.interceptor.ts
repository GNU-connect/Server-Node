import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ContextControl } from 'src/common/interfaces/context';
import { SkillResponse } from 'src/common/interfaces/response';
import { SkillTemplate } from 'src/common/interfaces/template';

export class KakaoInterceptor {
  private static readonly VERSION: string = '2.0';

  // 응답 객체 생성
  static createResponse(
    template: SkillTemplate,
    context?: ContextControl,
    data?: Map<string, any>,
  ): SkillResponse {
    return {
      version: KakaoInterceptor.VERSION,
      template,
      context,
      data,
    };
  }

  static generateResponseJson(
    template: SkillTemplate,
    context?: ContextControl,
    data?: Map<string, any>,
  ): string {
    const response = KakaoInterceptor.createResponse(template, context, data);
    return JSON.stringify(response, null, 2);
  }
}
