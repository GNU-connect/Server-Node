import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsEntity } from './entities/news.entity';
import { CommonModule } from '../common/common.module';
import { NewsRepository } from './repository/news.repository';

@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([NewsEntity]),
  ],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository],
})
export class NewsModule {}
