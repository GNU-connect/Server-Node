import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createSimpleText } from 'src/api/common/utils/component';

@Injectable()
export class CommonMessagesService {
  createSimpleText(text: string): SkillTemplate {
    return {
      outputs: [createSimpleText(text)],
    };
  }
}
