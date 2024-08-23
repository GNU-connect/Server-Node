import { Injectable } from '@nestjs/common';
import { ContextControl } from 'src/common/interfaces/response/fields/context';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { ResponseDTO } from '../../common/dto/response.dto';

@Injectable()
export class AppService {
  getHello(): ResponseDTO {
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

    return new ResponseDTO(exampleTemplate, exampleContext, exampleData);
  }
}
