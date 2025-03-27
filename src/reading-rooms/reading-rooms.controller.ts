import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';
import { ResponseDTO } from 'src/common/dtos/response.dto';
import { ApiSkillBody } from '../common/decorators/api-skill-body.decorator';
import { ListReadingRoomsRequestDto } from './dtos/request/list-reading-rooms-request.dto';
import { GetReadingRoomDetailRequestDto } from './dtos/request/get-reading-room-detail-request.dto';
import { SkillPayloadDto } from '../common/dtos/requests/skill-payload.dto';
import { plainToInstance } from 'class-transformer';
import { ReadingRoomsService } from './reading-rooms.service';

@ApiTags('reading-rooms')
@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(
    private readonly readingRoomsService: ReadingRoomsService,
    private readonly commonService: CommonService,
  ) {}

  @Post('campuses/list')
  public async listCampuses(): Promise<ResponseDTO> {
    const blockId = BlockId.READING_ROOM_LIST;
    const template = await this.commonService.campusesListCard(blockId);
    return new ResponseDTO(template);
  }

  @Post('list')
  @ApiSkillBody(ListReadingRoomsRequestDto)
  public async listReadingRooms(
    @Body() body: SkillPayloadDto,
  ): Promise<ResponseDTO> {
    const { campusId } = plainToInstance(
      ListReadingRoomsRequestDto,
      body.action.clientExtra,
    );
    const blockId = BlockId.READING_ROOM_DETAIL;
    const template = await this.readingRoomsService.readingRoomsListCard(
      campusId,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('detail')
  @ApiSkillBody(GetReadingRoomDetailRequestDto)
  public async getReadingRoomDetail(
    @Body() body: SkillPayloadDto,
  ): Promise<ResponseDTO> {
    const { readingRoomId } = plainToInstance(
      GetReadingRoomDetailRequestDto,
      body.action.clientExtra,
    );
    const template =
      await this.readingRoomsService.readingRoomDetailComplexCard(
        readingRoomId,
      );
    return new ResponseDTO(template);
  }
}
