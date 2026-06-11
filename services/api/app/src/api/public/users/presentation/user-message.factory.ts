import { Injectable } from '@nestjs/common';
import { TextCard } from 'src/api/common/interfaces/response/fields/component';
import { Button } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createTextCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import { UserProfileResult } from 'src/api/public/users/application/dtos/results/user-profile-result.dto';

@Injectable()
export class UserMessageFactory {
  createProfileMessage(result: UserProfileResult): SkillTemplate {
    const buttons: Array<Button> = [
      {
        label: '캠퍼스 및 학과 변경',
        action: 'block',
        blockId: BlockId.CHANGE_PROFILE,
      },
    ];

    const textCard: TextCard = createTextCard(
      '내 정보',
      `[ID]\n${result.userId}\n\n[캠퍼스]\n${result.campusName}\n\n[전공]\n${result.affiliationName}`,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
