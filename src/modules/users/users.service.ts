import { Injectable } from '@nestjs/common';
import { createSimpleText, createTextCard } from 'src/modules/common/utils/component';
import { SkillTemplate } from 'src/modules/common/interfaces/response/fields/template';
import { UsersRepository } from './repositories/users.repository';
import { TextCard } from 'src/modules/common/interfaces/response/fields/component';
import { BlockId } from 'src/modules/common/utils/constants';
import { Button } from 'src/modules/common/interfaces/response/fields/etc';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  @Transactional()
  public async upsertDepartment(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<SkillTemplate> {
    await this.usersRepository.save(userId, campusId, departmentId);
    const isExist = await this.usersRepository.existsByUserId(userId);
    let message: string;
    if (isExist) {
      message = '학과 정보를 수정했어!';
    } else {
      message = '학과 정보를 등록했어!';
    }
    return {
      outputs: [createSimpleText(message)],
    };
  }

  public async profileTextCard(userId: string): Promise<SkillTemplate> {
    let affiliation = '미등록';
    let campus = '미등록';
    const user = await this.usersRepository.findByUserId(userId);
    if (user) {
      campus = user.campus.name;
      affiliation = user.department.college.name + ' ' + user.department.name;
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
      `[ID]\n${userId}\n\n[캠퍼스]\n${campus}\n\n[전공]\n${affiliation}\n\n[부전공]\n미지원`,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
