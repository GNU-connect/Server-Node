import { Controller, Post } from '@nestjs/common';
import { NewsService } from './news.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('get/news')
  async getCampus(): Promise<ResponseDTO> {
    const template = await this.newsService.getNewsListCard();
    return new ResponseDTO(template);
  }
}
