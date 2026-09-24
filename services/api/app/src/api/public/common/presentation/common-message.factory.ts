import { Injectable } from '@nestjs/common';
import { TextCard } from 'src/api/common/interfaces/response/fields/component';
import { Button } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createSimpleText, createTextCard } from 'src/api/common/utils/component';
import { KakaoBlockId } from 'src/api/common/presentation/kakao.constants';

@Injectable()
export class CommonMessageFactory {
  createSimpleText(text: string): SkillTemplate {
    return {
      outputs: [createSimpleText(text)],
    };
  }

  /**
   * 학과 인증 필요 메시지 생성
   * @returns SkillTemplate (TextCard with button)
   */
  createDepartmentAuthRequiredMessage(): SkillTemplate {
    const buttons: Button[] = [
      {
        label: '학과 등록',
        action: 'block',
        blockId: KakaoBlockId.CHANGE_PROFILE,
      },
    ];

    const textCard: TextCard = createTextCard(
      '잠깐! 학과 인증이 필요한 서비스야!\n아래 버튼을 눌러 학과를 등록해줘!',
      undefined,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
