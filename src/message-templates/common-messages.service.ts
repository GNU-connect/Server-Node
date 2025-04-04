import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createSimpleText } from 'src/common/utils/component';

@Injectable()
export class CommonMessagesService {
  createSimpleText(text: string): SkillTemplate {
    return {
      outputs: [createSimpleText(text)],
    };
  }
}
