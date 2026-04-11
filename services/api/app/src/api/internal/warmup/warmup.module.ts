import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CafeteriasModule } from 'src/api/public/cafeterias/cafeterias.module';
import { CafeteriasRepositoryModule } from 'src/type-orm/entities/cafeterias/cafeterias-repository.module';
import { WarmupService } from './warmup.service';

@Module({
  imports: [ScheduleModule.forRoot(), CafeteriasModule, CafeteriasRepositoryModule],
  providers: [WarmupService],
})
export class WarmupModule {}
