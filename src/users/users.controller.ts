import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/common/decorators/api-skill-body.decorator';
import { SkillExtra } from 'src/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/common/dtos/response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { User } from './entities/users.entity';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile/get')
  @UseInterceptors(CurrentUserInterceptor)
  getProfile(@CurrentUser() user: User): ResponseDTO {
    const template = this.usersService.profileTextCard(user);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  async listCampuses(): Promise<ResponseDTO> {
    const template = await this.usersService.campusesListCard();
    return new ResponseDTO(template);
  }

  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  async listColleges(
    @SkillExtra(ListCollegesRequestDto) extra: ListCollegesRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.usersService.collegesListCard(extra);
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  async listDepartments(
    @SkillExtra(ListDepartmentsRequestDto) extra: ListDepartmentsRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.usersService.departmentsListCard(extra);
    return new ResponseDTO(template);
  }

  @Post('department/upsert')
  @UseInterceptors(CurrentUserInterceptor)
  @ApiSkillBody(UpsertDepartmentRequestDto)
  async upsert(
    @CurrentUser() user: User,
    @SkillExtra(UpsertDepartmentRequestDto) extra: UpsertDepartmentRequestDto,
  ): Promise<ResponseDTO> {
    await this.usersService.upsert(user.id, extra);
    const template = this.usersService.upsertTextCard();
    return new ResponseDTO(template);
  }
}
