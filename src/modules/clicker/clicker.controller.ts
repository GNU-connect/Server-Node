import { Body, Controller, Post } from '@nestjs/common';
import { ClickerService } from './clicker.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';
import { GetReadingRoomDetailDto, GetReadingRoomDto } from './dtos/clicker.dto';

@ApiTags('clicker')
@Controller('clicker')
export class ClickerController {
  constructor(
    private readonly clickerService: ClickerService,
    private readonly commonService: CommonService,
  ) {}

  @Post('get/campus')
  async getCampus(): Promise<ResponseDTO> {
    const blockId = BlockId.READING_ROOM_LIST;
    const template = await this.commonService.getCampusListCard(blockId);
    return new ResponseDTO(template);
  }

  @Post('get/reading-room')
  async getReadingRoom(@Body() body: GetReadingRoomDto): Promise<ResponseDTO> {
    const { campusId } = body;
    const blockId = BlockId.READING_ROOM_DETAIL;
    const template = await this.clickerService.getReadingRoomListCard(
      campusId,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/reading-room-detail')
  async getReadingRoomDetail(@Body() body: GetReadingRoomDetailDto): Promise<ResponseDTO> {
    const { readingRoomId } = body
    const template = await this.clickerService.getReadingRoomDetailCard(
      readingRoomId,
    );
    return new ResponseDTO(template);
  }
}
