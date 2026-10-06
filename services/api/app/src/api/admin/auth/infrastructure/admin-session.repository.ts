import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSession } from 'src/api/admin/auth/domain/entities/admin-session.entity';

@Injectable()
export class AdminSessionRepository {
  constructor(
    @InjectRepository(AdminSession)
    private readonly adminSessionRepository: Repository<AdminSession>,
  ) {}

  async create(adminUserId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    const session = this.adminSessionRepository.create({
      tokenHash,
      expiresAt,
      adminUser: { id: adminUserId },
    });
    await this.adminSessionRepository.save(session);
  }

  findByTokenHash(tokenHash: string): Promise<AdminSession | null> {
    return this.adminSessionRepository.findOne({ where: { tokenHash } });
  }

  async extend(id: number, expiresAt: Date): Promise<void> {
    await this.adminSessionRepository.update({ id }, { expiresAt });
  }

  async deleteById(id: number): Promise<void> {
    await this.adminSessionRepository.delete({ id });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.adminSessionRepository.delete({ tokenHash });
  }

  async deleteExpiredOf(adminUserId: number, now: Date): Promise<void> {
    await this.adminSessionRepository
      .createQueryBuilder()
      .delete()
      .from(AdminSession)
      .where('admin_user_id = :adminUserId AND expires_at <= :now', { adminUserId, now })
      .execute();
  }
}
