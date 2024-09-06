import { Injectable } from '@nestjs/common';
import { createSimpleText, createTextCard } from 'src/common/utils/component';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { UserRepository } from './repository/user.repository';
import {
  SimpleText,
  TextCard,
} from 'src/common/interfaces/response/fields/component';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async upsertUserDepartment(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<SkillTemplate> {
    let simpleText = null;

    const isExist = await this.userRepository.findOne(userId);
    if (isExist) {
      await this.userRepository.updateUserInfo(userId, campusId, departmentId);
      simpleText = createSimpleText('학과 정보를 수정했어!');
    } else {
      await this.userRepository.createUserInfo(userId, campusId, departmentId);
      simpleText = createSimpleText('학과 정보를 등록했어!');
    }
    return {
      outputs: [simpleText],
    };
  }

  async getUserProfile(userId: string): Promise<SkillTemplate> {
    let affiliation = '미등록';
    const user = await this.userRepository.findOne(userId);
    const campus = user.campus ? user.campus.name : '미등록';

    if (user) {
      affiliation = user.department.college.name + ' ' + user.department.name;
    }
    const textCard: TextCard = createTextCard(
      '내 정보',
      `[ID]\n${user.id}\n\n[캠퍼스]\n${campus}\n\n[전공]\n${affiliation}\n\n[부전공]\n미지원`,
    );
    const buttons = [
      {
        label: '학과 정보 수정',
        action: 'block',
        blockId: '학과 정보 수정',
      },
    ];

    return {
      outputs: [textCard],
    };
  }
}
