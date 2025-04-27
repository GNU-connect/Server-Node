import { Injectable } from '@nestjs/common';
import { TextCard } from 'src/api/common/interfaces/response/fields/component';
import { Button } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createTextCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import { User } from 'src/type-orm/entities/users/users.entity';

@Injectable()
export class UserMessageService {
  createProfileMessage(user: User): SkillTemplate {
    const campus = user.campus?.name || '미등록';
    const college = user.department?.college?.name;
    const department = user.department?.name;

    let affiliation = '';
    if (!college && !department) {
      affiliation = '미등록';
    } else {
      affiliation = college + ' ' + department;
    }

    const buttons: Array<Button> = [
      {
        label: '캠퍼스 및 학과 변경',
        action: 'block',
        blockId: BlockId.CHANGE_PROFILE,
      },
    ];

    const textCard: TextCard = createTextCard(
      '내 정보',
      `[ID]\n${user.id}\n\n[캠퍼스]\n${campus}\n\n[전공]\n${affiliation}`,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
