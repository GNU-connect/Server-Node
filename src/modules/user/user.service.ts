import { Injectable } from '@nestjs/common';
import { createSimpleText } from 'src/common/utils/component';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { UserRepository } from './repository/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async upsertUserDepartment(
    userId: string,
    departmentId: number,
  ): Promise<SkillTemplate> {
    let simpleText = null;

    const isExist = await this.userRepository.findOne(userId);
    if (isExist) {
      await this.userRepository.updateUserInfo(userId, departmentId);
      simpleText = createSimpleText('학과 정보를 수정했어!');
    } else {
      await this.userRepository.createUserInfo(userId, departmentId);
      simpleText = createSimpleText('학과 정보를 등록했어!');
    }
    return {
      outputs: [simpleText],
    };
  }
}
