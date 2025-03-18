import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';
import { GetCollegeDto, GetDepartmentDto, GetProfileDto, UpdateDepartmentDto } from './dtos/user.dto';

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
  async getCollege(@Body() body: GetCollegeDto): Promise<ResponseDTO> {
    const { campusId, page } = body;
    const blockId = BlockId.DEPARTMENT_LIST;
    const template = await this.commonService.getCollegeListCard(
      campusId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/department')
  async getDepartment(@Body() body: GetDepartmentDto): Promise<ResponseDTO> {
    const { campusId, collegeId, page } = body;
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
  async upsertUserDepartment(@Body() body: UpdateDepartmentDto): Promise<ResponseDTO> {
    const { userId, campusId, departmentId } = body;
    const template = await this.userService.upsertUserDepartment(
      userId,
      campusId,
      departmentId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/profile')
  async getUserProfile(@Body() body: GetProfileDto): Promise<ResponseDTO> {
    const { userId } = body;
    const template = await this.userService.getUserProfile(userId);
    return new ResponseDTO(template);
  }
}
