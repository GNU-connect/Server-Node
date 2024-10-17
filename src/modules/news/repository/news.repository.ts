import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '../entities/news.entity';

@Injectable()
export class NewsRepository {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
  ) {}

  async findAll(): Promise<NewsEntity[]> {
    return await this.newsRepository.find({
      select: ['id', 'title', 'registrationTime', 'url'],
      order: {
        id: 'asc',
      },
    });
  }
}
