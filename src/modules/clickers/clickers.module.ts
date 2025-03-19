import { Module } from '@nestjs/common';
import { ClickersService } from './clickers.service';
import { ClickersController } from './clickers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';
import { ClickersRepository } from './repositories/clickers.repository';
import { Clicker } from './entities/clickers.entity';

@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([Clicker]),
  ],
  controllers: [ClickersController],
  providers: [ClickersService, ClickersRepository],
})
export class ClickersModule {}
