import { Injectable } from '@nestjs/common';
import { ContextControl } from 'src/common/interfaces/context';
import { SkillTemplate } from 'src/common/interfaces/template';
import { KakaoInterceptor } from 'src/interceptor/kakao.interceptor';

@Injectable()
export class AppService {
  getHello(): any {
    const exampleTemplate: SkillTemplate = {
      outputs: [
        {
          simpleText: {
            text: 'Hello, world!',
          },
        },
      ],
    };

    const exampleContext: ContextControl = {
      values: [
        {
          name: 'user_id',
          lifeSpan: 1,
          params: { id: '12345' },
        },
      ],
    };

    const exampleData: Map<string, any> = new Map();
    exampleData.set('exampleKey', 'exampleValue');

    const responseJson = KakaoInterceptor.generateResponseJson(
      exampleTemplate,
      exampleContext,
      exampleData,
    );

    return responseJson;
  }
}
