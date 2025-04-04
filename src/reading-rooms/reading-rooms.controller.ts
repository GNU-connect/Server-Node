import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkillExtra } from 'src/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/common/dtos/response.dto';
import { ApiSkillBody } from '../common/decorators/api-skill-body.decorator';
import { GetReadingRoomDetailRequestDto } from './dtos/request/get-reading-room-detail-request.dto';
import { ListReadingRoomsRequestDto } from './dtos/request/list-reading-rooms-request.dto';
import { ReadingRoomsService } from './reading-rooms.service';

@ApiTags('reading-rooms')
@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(private readonly readingRoomsService: ReadingRoomsService) {}

  @Post('campuses/list')
  public async listCampuses(): Promise<ResponseDTO> {
    const template = await this.readingRoomsService.campusesListCard();
    return new ResponseDTO(template);
  }

  @Post('list')
  @ApiSkillBody(ListReadingRoomsRequestDto)
  public async listReadingRooms(
    @SkillExtra(ListReadingRoomsRequestDto) extra: ListReadingRoomsRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.readingRoomsService.readingRoomsListCard(extra);
    return new ResponseDTO(template);
  }

  @Post('detail')
  @ApiSkillBody(GetReadingRoomDetailRequestDto)
  public async getReadingRoomDetail(
    @SkillExtra(GetReadingRoomDetailRequestDto)
    extra: GetReadingRoomDetailRequestDto,
  ): Promise<ResponseDTO> {
    const template =
      await this.readingRoomsService.readingRoomDetailComplexCard(extra);
    return new ResponseDTO(template);
  }
}
