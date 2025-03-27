import { Injectable, NotFoundException } from '@nestjs/common';
import { createSimpleText, createTextCard } from 'src/common/utils/component';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { UsersRepository } from './repositories/users.repository';
import { TextCard } from 'src/common/interfaces/response/fields/component';
import { BlockId } from 'src/common/utils/constants';
import { Button } from 'src/common/interfaces/response/fields/etc';
import { Transactional } from 'typeorm-transactional';
import { User } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public findOneByUserId(userId: string): Promise<User> {
    return this.usersRepository.findOneByUserId(userId);
  }

  @Transactional()
  public async upsertDepartment(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<SkillTemplate> {
    await this.usersRepository.save(userId, campusId, departmentId);
    const message = '학과 정보를 등록했어!';
    return {
      outputs: [createSimpleText(message)],
    };
  }

  public async profileTextCard(user: User): Promise<SkillTemplate> {
    let affiliation = '미등록';
    let campus = '미등록';

    if (user.campus && user.department) {
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
      `[ID]\n${user.id}\n\n[캠퍼스]\n${campus}\n\n[전공]\n${affiliation}`,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
