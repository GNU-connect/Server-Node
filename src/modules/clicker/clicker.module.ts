import { Module } from '@nestjs/common';
import { ClickerService } from './clicker.service';
import { ClickerController } from './clicker.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';
import { ClickerRepository } from './repository/clicker.repository';
import { ClickerEntity } from './entities/clicker.entity';

@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([ClickerEntity]),
  ],
  controllers: [ClickerController],
  providers: [ClickerService, ClickerRepository],
})
export class ClickerModule {}
