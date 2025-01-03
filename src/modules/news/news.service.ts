import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { NewsRepository } from './repository/news.repository';
import { Button, ListItem } from 'src/common/interfaces/response/fields/etc';
import { createListCard } from 'src/common/utils/component';
import { ListCard } from 'src/common/interfaces/response/fields/component';

@Injectable()
export class NewsService {
  constructor(private readonly newsRepository: NewsRepository) {}
  async getNewsListCard(): Promise<SkillTemplate> {
    const newsEntities = await this.newsRepository.findAll();

    const header: ListItem = {
      title: '최신 뉴스',
    };

    const items: ListItem[] = newsEntities.map((newsEntity) => {
      return {
        title: newsEntity.title,
        description: newsEntity.registrationTime,
        link: {
          web: newsEntity.url,
        },
      };
    });

    const buttons: Array<Button> = [
      {
        label: '더보기',
        action: 'webLink',
        webLinkUrl: 'https://www.gnunews.kr/',
      },
    ];

    const newsListCard: ListCard = createListCard(header, items, buttons);

    return {
      outputs: [newsListCard],
    };
  }
}
