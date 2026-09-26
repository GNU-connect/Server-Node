import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from 'src/api/admin/common/guards/admin-api-key.guard';
import { ScrapeRunsService } from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { ScrapeRunRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';
import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';
import { ScrapeRunsController } from 'src/api/admin/scrape-runs/presentation/scrape-runs.controller';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeRun, Cafeteria, NoticeCategory])],
  controllers: [ScrapeRunsController],
  providers: [ScrapeRunsService, ScrapeRunRepository, ScrapeTargetsRepository, AdminApiKeyGuard],
})
export class ScrapeRunsModule {}
