import { AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';
import { ScrapeRunsController } from './scrape-runs.controller';

describe('ScrapeRunsController', () => {
  it('어드민 세션 가드로 보호된다', () => {
    const guards: unknown[] = Reflect.getMetadata('__guards__', ScrapeRunsController) ?? [];

    expect(guards).toContain(AdminSessionGuard);
  });
});
