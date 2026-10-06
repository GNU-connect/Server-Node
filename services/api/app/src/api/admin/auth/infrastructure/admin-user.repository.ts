import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from 'src/api/admin/auth/domain/entities/admin-user.entity';

@Injectable()
export class AdminUserRepository {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminUserRepository.findOne({ where: { email } });
  }

  /** 한 번의 UPDATE로 올린다. 동시 요청이 와도 횟수가 유실되지 않는다. 올라간 값을 돌려준다. */
  async incrementFailedLogins(id: number): Promise<number> {
    const result = await this.adminUserRepository
      .createQueryBuilder()
      .update(AdminUser)
      .set({ failedLoginCount: () => 'failed_login_count + 1' })
      .where('id = :id', { id })
      .returning('failed_login_count')
      .execute();
    return Number(result.raw[0].failed_login_count);
  }

  async lock(id: number, until: Date): Promise<void> {
    await this.adminUserRepository.update({ id }, { failedLoginCount: 0, lockedUntil: until });
  }

  async clearFailures(id: number): Promise<void> {
    await this.adminUserRepository.update({ id }, { failedLoginCount: 0, lockedUntil: null });
  }
}
