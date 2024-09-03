import { Body, Controller, Post } from '@nestjs/common';
import { ClickerService } from './clicker.service';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';

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
  async getReadingRoom(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const campusId = clientExtra['campusId'];
    const blockId = BlockId.READING_ROOM_DETAIL;
    const template = await this.clickerService.getReadingRoomListCard(
      campusId,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/reading-room-detail')
  async getReadingRoomDetail(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const readingRoomId = clientExtra['readingRoomId'];
    const template = await this.clickerService.getReadingRoomDetailCard(
      readingRoomId,
    );
    return new ResponseDTO(template);
  }
}
