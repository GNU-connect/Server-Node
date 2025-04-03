import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiSkillBody } from 'src/common/decorators/api-skill-body.decorator';
import { SkillPayloadDto } from 'src/common/dtos/requests/skill-payload.dto';
import { ResponseDTO } from 'src/common/dtos/response.dto';
import { createSimpleText } from 'src/common/utils/component';
import { ProfileResponseDto } from 'src/users/dtos/responses/profile-response.dto';
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
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    const template = await this.usersService.profileTextCard(user);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  async listCampuses(): Promise<ResponseDTO> {
    const template = await this.usersService.campusesListCard();
    return new ResponseDTO(template);
  }

  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  async listColleges(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, page } = plainToInstance(
      ListCollegesRequestDto,
      body.action.clientExtra,
    );
    const template = await this.usersService.collegesListCard(campusId, page);
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  async listDepartments(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, collegeId, page } = plainToInstance(
      ListDepartmentsRequestDto,
      body.action.clientExtra,
    );

    const template = await this.usersService.departmentsListCard(
      campusId,
      collegeId,
      page,
    );
    return new ResponseDTO(template);
  }

  @Post('department/upsert')
  @UseInterceptors(CurrentUserInterceptor)
  @ApiSkillBody(UpsertDepartmentRequestDto)
  async upsert(
    @CurrentUser() user: User,
    @Body() body: SkillPayloadDto,
  ): Promise<ResponseDTO> {
    const { campusId, departmentId } = plainToInstance(
      UpsertDepartmentRequestDto,
      body.action.clientExtra,
    );
    await this.usersService.upsertDepartment(user.id, campusId, departmentId);
    const template = {
      outputs: [createSimpleText('학과 정보를 등록했어!')],
    };
    return new ResponseDTO(template);
  }
}
