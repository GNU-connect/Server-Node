import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { UserMessageService } from 'src/users/user-message.service';
import { Transactional } from 'typeorm-transactional';
import { User } from './entities/users.entity';
import { UsersRepository } from './repositories/users.repository';
import { BlockId } from 'src/common/utils/constants';
import { CampusesService } from 'src/campuses/campuses.service';
import { CollegesService } from 'src/colleges/colleges.service';
import { DepartmentsService } from 'src/departments/departments.service';
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userMessageService: UserMessageService,
    private readonly campusesService: CampusesService,
    private readonly collegesService: CollegesService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  public async campusesListCard(): Promise<SkillTemplate> {
    const blockId = BlockId.COLLEGE_LIST;
    return this.campusesService.campusesListCard(blockId);
  }

  public async collegesListCard(
    campusId: number,
    page: number,
  ): Promise<SkillTemplate> {
    const blockId = BlockId.DEPARTMENT_LIST;
    return this.collegesService.collegesListCard(campusId, page, blockId);
  }

  public async departmentsListCard(
    campusId: number,
    collegeId: number,
    page: number,
  ): Promise<SkillTemplate> {
    const blockId = BlockId.UPDATE_DEPARTMENT;
    return this.departmentsService.departmentsListCard(
      campusId,
      collegeId,
      page,
      blockId,
    );
  }

  public findOne(userId: string): Promise<User> {
    return this.usersRepository.findOne(userId);
  }

  public async profileTextCard(user: User): Promise<SkillTemplate> {
    const textCard = this.userMessageService.createProfileMessage(user);

    return {
      outputs: [textCard],
    };
  }

  @Transactional()
  public upsertDepartment(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<User> {
    return this.usersRepository.save(userId, campusId, departmentId);
  }
}
