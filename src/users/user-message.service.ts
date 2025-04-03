import { Injectable } from '@nestjs/common';
import { TextCard } from 'src/common/interfaces/response/fields/component';
import { createTextCard } from 'src/common/utils/component';
import { BlockId } from 'src/common/utils/constants';
import { Button } from 'src/common/interfaces/response/fields/etc';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class UserMessageService {
  createProfileMessage(user: User): TextCard {
    const campus = user.campus.name || '미등록';
    const affiliation =
      user.department.college.name + ' ' + user.department.name || '미등록';

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

    return textCard;
  }
}
