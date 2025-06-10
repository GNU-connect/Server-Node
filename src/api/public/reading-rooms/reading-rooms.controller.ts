import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { SkillExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { Cacheable } from 'src/cache/decorators/cache-key.decorator';
import { RedisInterceptor } from 'src/cache/interceptors/redis.interceptor';
import { GetReadingRoomDetailRequestDto } from './dtos/request/get-reading-room-detail-request.dto';
import { ListReadingRoomsRequestDto } from './dtos/request/list-reading-rooms-request.dto';
import { ReadingRoomsService } from './reading-rooms.service';

@ApiTags('reading-rooms')
@Controller('reading-rooms')
@UseInterceptors(RedisInterceptor)
export class ReadingRoomsController {
  constructor(private readonly readingRoomsService: ReadingRoomsService) {}

  @Post('campuses/list')
  @Cacheable({
    key: 'reading-rooms-campuses-list',
    ttl: 60 * 60 * 24,
  })
  public async listCampuses(): Promise<ResponseDTO> {
    const template = await this.readingRoomsService.campusesListCard();
    return new ResponseDTO(template);
  }

  @Post('list')
  @ApiSkillBody(ListReadingRoomsRequestDto)
  @Cacheable({
    key: 'reading-rooms-list',
    ttl: 60 * 60 * 24,
  })
  public async listReadingRooms(
    @SkillExtra(ListReadingRoomsRequestDto) extra: ListReadingRoomsRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.readingRoomsService.readingRoomsListCard(extra);
    return new ResponseDTO(template);
  }

  @Post('detail')
  @ApiSkillBody(GetReadingRoomDetailRequestDto)
  @Cacheable({
    key: 'reading-rooms-detail',
    ttl: 60 * 60 * 24,
  })
  public async getReadingRoomDetail(
    @SkillExtra(GetReadingRoomDetailRequestDto)
    extra: GetReadingRoomDetailRequestDto,
  ): Promise<ResponseDTO> {
    const template =
      await this.readingRoomsService.readingRoomDetailComplexCard(extra);
    return new ResponseDTO(template);
  }
}
