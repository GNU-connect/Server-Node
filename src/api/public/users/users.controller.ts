import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { Cacheable } from 'src/cache/decorators/cache-key.decorator';
import { RedisInterceptor } from 'src/cache/interceptors/redis.interceptor';
import { User } from '../../../type-orm/entities/users/users.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@UseInterceptors(RedisInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile/get')
  getProfile(@CurrentUser() user: User): ResponseDTO {
    const template = this.usersService.profileTextCard(user);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  @Cacheable({
    key: 'users-campuses-list',
    ttl: 60 * 60 * 24,
  })
  async listCampuses(): Promise<ResponseDTO> {
    const template = await this.usersService.campusesListCard();
    return new ResponseDTO(template);
  }

  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  @Cacheable({
    key: 'users-colleges-list',
    ttl: 60 * 60 * 24,
  })
  async listColleges(
    @ClientExtra(ListCollegesRequestDto) extra: ListCollegesRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.usersService.collegesListCard(extra);
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  @Cacheable({
    key: 'users-departments-list',
    ttl: 60 * 60 * 24,
  })
  async listDepartments(
    @ClientExtra(ListDepartmentsRequestDto) extra: ListDepartmentsRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.usersService.departmentsListCard(extra);
    return new ResponseDTO(template);
  }

  @Post('department/upsert')
  @ApiSkillBody(UpsertDepartmentRequestDto)
  async upsert(
    @CurrentUser() user: User,
    @ClientExtra(UpsertDepartmentRequestDto) extra: UpsertDepartmentRequestDto,
  ): Promise<ResponseDTO> {
    await this.usersService.upsert(user.id, extra);
    const template = this.usersService.upsertTextCard();
    return new ResponseDTO(template);
  }
}
