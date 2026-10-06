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

  /**
   * 한 번의 UPDATE로 올린다. 동시 요청이 와도 횟수가 유실되지 않는다.
   * 이미 잠긴 계정이면 아무것도 올리지 않고 null을 돌려준다. 아니면 올라간 값을 돌려준다.
   */
  async incrementFailedLogins(id: number, now: Date): Promise<number | null> {
    const result = await this.adminUserRepository
      .createQueryBuilder()
      .update(AdminUser)
      .set({ failedLoginCount: () => 'failed_login_count + 1' })
      .where('id = :id AND (locked_until IS NULL OR locked_until <= :now)', { id, now })
      .returning('failed_login_count')
      .execute();
    if (!result.raw.length) return null;
    return Number(result.raw[0].failed_login_count);
  }

  async lock(id: number, until: Date): Promise<void> {
    await this.adminUserRepository.update({ id }, { failedLoginCount: 0, lockedUntil: until });
  }

  /** 잠겨 있지 않을 때만 실패 기록을 지운다. 그 사이 잠겼다면 false. */
  async clearFailuresIfUnlocked(id: number, now: Date): Promise<boolean> {
    const result = await this.adminUserRepository
      .createQueryBuilder()
      .update(AdminUser)
      .set({ failedLoginCount: 0, lockedUntil: null })
      .where('id = :id AND (locked_until IS NULL OR locked_until <= :now)', { id, now })
      .execute();
    return (result.affected ?? 0) > 0;
  }
}
