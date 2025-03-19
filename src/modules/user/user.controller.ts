import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { ApiHideProperty, ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';
import { GetCollegeDto, GetDepartmentDto, UpdateDepartmentDto } from './dtos/user.dto';
import { SkillPayloadDto } from 'src/common/dto/request/skill-payload.dto';
import { plainToInstance } from 'class-transformer';
import { ApiSkillBody } from 'src/common/decorators/api-skill-body.decorator';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commonService: CommonService,
  ) {}

  @Post('get/campus')
  async getCampus(): Promise<ResponseDTO> {
    const blockId = BlockId.COLLEGE_LIST;
    const template = await this.commonService.getCampusListCard(blockId);
    return new ResponseDTO(template);
  }
  
  @Post('get/college')
  @ApiSkillBody(GetCollegeDto)
  async getCollege(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, page } = plainToInstance(GetCollegeDto, body.action.clientExtra);
    const blockId = BlockId.DEPARTMENT_LIST;
    const template = await this.commonService.getCollegeListCard(
      campusId,
      page,
      blockId,
    );
    console.log(template.quickReplies);
    return new ResponseDTO(template);
  }

  @Post('get/department')
  @ApiSkillBody(GetDepartmentDto)
  async getDepartment(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, collegeId, page } = plainToInstance(GetDepartmentDto, body.action.clientExtra);
    const blockId = BlockId.UPDATE_DEPARTMENT;
    const template = await this.commonService.getDepartmentListCard(
      campusId,
      collegeId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('update/department')
  @ApiSkillBody(UpdateDepartmentDto)
  async upsertUserDepartment(@Req() req: Request, @Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const userId = req['userId'];
    const { campusId, departmentId } = plainToInstance(UpdateDepartmentDto, body.action.clientExtra);
    const template = await this.userService.upsertUserDepartment(
      userId,
      campusId,
      departmentId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/profile')
  async getUserProfile(@Req() req: Request): Promise<ResponseDTO> {
    const userId = req['userId'];
    const template = await this.userService.getUserProfile(userId);
    return new ResponseDTO(template);
  }
}
