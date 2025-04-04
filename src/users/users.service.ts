import { Injectable } from '@nestjs/common';
import { CampusesService } from 'src/campuses/campuses.service';
import { CollegesService } from 'src/colleges/colleges.service';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { BlockId } from 'src/common/utils/constants';
import { DepartmentsService } from 'src/departments/departments.service';
import { CommonMessagesService } from 'src/message-templates/common-messages.service';
import { UserMessageService } from 'src/message-templates/user-messages.service';
import { ListCollegesRequestDto } from 'src/users/dtos/requests/list-college-request.dto';
import { ListDepartmentsRequestDto } from 'src/users/dtos/requests/list-department-request.dto';
import { UpsertDepartmentRequestDto } from 'src/users/dtos/requests/upsert-department-request.dto';
import { Transactional } from 'typeorm-transactional';
import { User } from './entities/users.entity';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userMessageService: UserMessageService,
    private readonly campusesService: CampusesService,
    private readonly collegesService: CollegesService,
    private readonly departmentsService: DepartmentsService,
    private readonly commonMessagesService: CommonMessagesService,
  ) {}

  public async campusesListCard(): Promise<SkillTemplate> {
    const blockId = BlockId.COLLEGE_LIST;
    return this.campusesService.campusesListCard(blockId);
  }

  public async collegesListCard(
    extra: ListCollegesRequestDto,
  ): Promise<SkillTemplate> {
    const blockId = BlockId.DEPARTMENT_LIST;
    return this.collegesService.collegesListCard(extra, blockId);
  }

  public async departmentsListCard(
    extra: ListDepartmentsRequestDto,
  ): Promise<SkillTemplate> {
    const blockId = BlockId.UPDATE_DEPARTMENT;
    return this.departmentsService.departmentsListCard(extra, blockId);
  }

  public findOne(userId: string): Promise<User> {
    return this.usersRepository.findOne(userId);
  }

  public profileTextCard(user: User): SkillTemplate {
    return this.userMessageService.createProfileMessage(user);
  }

  public upsertTextCard(): SkillTemplate {
    return this.commonMessagesService.createSimpleText('학과 정보를 등록했어!');
  }

  @Transactional()
  public upsert(
    userId: string,
    extra: UpsertDepartmentRequestDto,
  ): Promise<User> {
    return this.usersRepository.save(userId, extra);
  }

  @Transactional()
  public upsertDepartment(
    userId: string,
    extra: UpsertDepartmentRequestDto,
  ): Promise<User> {
    return this.usersRepository.save(userId, extra);
  }
}
