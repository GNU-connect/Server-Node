import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminSession } from 'src/api/admin/auth/domain/entities/admin-session.entity';
import { AdminUser } from 'src/api/admin/auth/domain/entities/admin-user.entity';
import { AdminSessionRepository } from 'src/api/admin/auth/infrastructure/admin-session.repository';
import { AdminUserRepository } from 'src/api/admin/auth/infrastructure/admin-user.repository';
import { AdminAuthController } from 'src/api/admin/auth/presentation/admin-auth.controller';
import { AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, AdminSession])],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminUserRepository, AdminSessionRepository, AdminSessionGuard],
  exports: [AdminAuthService, AdminSessionGuard],
})
export class AdminAuthModule {}
