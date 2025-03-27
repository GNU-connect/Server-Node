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

  public async findOneByUserId(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneByUserId(userId);

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    return user;
  }

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

  public async profileTextCard(user: User): Promise<SkillTemplate> {
    let affiliation = '미등록';
    let campus = '미등록';
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
      `[ID]\n${user.id}\n\n[캠퍼스]\n${campus}\n\n[전공]\n${affiliation}\n\n[부전공]\n미지원`,
      buttons,
    );

    return {
      outputs: [textCard],
    };
  }
}
