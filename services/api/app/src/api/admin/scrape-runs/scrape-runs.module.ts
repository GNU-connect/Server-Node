import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminApiKeyGuard } from 'src/api/admin/common/guards/admin-api-key.guard';
import { ScrapeRunsService } from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { ScrapeRunRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';
import { ScrapeRunsController } from 'src/api/admin/scrape-runs/presentation/scrape-runs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeRun])],
  controllers: [ScrapeRunsController],
  providers: [ScrapeRunsService, ScrapeRunRepository, AdminApiKeyGuard],
})
export class ScrapeRunsModule {}
