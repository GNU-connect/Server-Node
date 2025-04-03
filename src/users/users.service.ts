import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createSimpleText } from 'src/common/utils/component';
import { UserMessageService } from 'src/users/user-message.service';
import { Transactional } from 'typeorm-transactional';
import { User } from './entities/users.entity';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userMessageService: UserMessageService,
  ) {}

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
    const textCard = this.userMessageService.createProfileMessage(user);

    return {
      outputs: [textCard],
    };
  }
}
