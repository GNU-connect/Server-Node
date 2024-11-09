import { Module } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { CafeteriaController } from './cafeteria.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CafeteriaController],
  providers: [CafeteriaService],
})
export class CafeteriaModule {}
