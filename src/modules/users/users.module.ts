import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './repositories/users.repository';
import { User } from './entities/users.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
