import { Test, TestingModule } from '@nestjs/testing';
import { ClickerService } from './reading-rooms.service';

describe('ClickerService', () => {
  let service: ClickerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClickerService],
    }).compile();

    service = module.get<ClickerService>(ClickerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
