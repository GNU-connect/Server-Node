import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentRepository } from './department.repository';

@Module({
  imports: [SupabaseModule, TypeOrmModule.forFeature([])],
  controllers: [UserController],
  providers: [UserService, DepartmentRepository],
})
export class UserModule {}
