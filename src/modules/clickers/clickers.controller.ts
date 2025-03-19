import { Body, Controller, Post } from '@nestjs/common';
import { ClickersService } from './clickers.service';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/modules/common/utils/constants';
import { ResponseDTO } from 'src/modules/common/dtos/response.dto';
import { GetReadingRoomDetailDto, GetReadingRoomDto } from './dtos/clickers.dto';

@ApiTags('clickers')
@Controller('clickers')
export class ClickersController {
  constructor(
    private readonly clickersService: ClickersService,
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
    const template = await this.clickersService.getReadingRoomListCard(
      campusId,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/reading-room-detail')
  async getReadingRoomDetail(@Body() body: GetReadingRoomDetailDto): Promise<ResponseDTO> {
    const { readingRoomId } = body
    const template = await this.clickersService.getReadingRoomDetailCard(
      readingRoomId,
    );
    return new ResponseDTO(template);
  }
}
