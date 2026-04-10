import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WarmupService } from './warmup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [WarmupService],
})
export class WarmupModule {}
