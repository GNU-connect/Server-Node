import { Injectable } from '@nestjs/common';
import { TextCard } from 'src/api/common/interfaces/response/fields/component';
import { Button } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createTextCard } from 'src/api/common/utils/component';
import { KakaoBlockId } from 'src/api/common/presentation/kakao.constants';
import { UserProfileResult } from 'src/api/public/users/application/dtos/results/user-profile-result.dto';

@Injectable()
export class UserMessageFactory {
  createProfileMessage(result: UserProfileResult): SkillTemplate {
    const campusName = result.campus?.name ?? '미등록';
    const affiliationName =
      !result.college && !result.department
        ? '미등록'
        : [result.college?.name, result.department?.name].filter(Boolean).join(' ');
    const buttons: Array<Button> = [
      {
        label: '캠퍼스 및 학과 변경',
        action: 'block',
        blockId: KakaoBlockId.CHANGE_PROFILE,
      },
    ];

    const textCard: TextCard = createTextCard(
      '내 정보',
      `[ID]\n${result.userId}\n\n[캠퍼스]\n${campusName}\n\n[전공]\n${affiliationName}`,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
