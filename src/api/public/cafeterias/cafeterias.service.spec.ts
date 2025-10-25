import { Test, TestingModule } from '@nestjs/testing';
import { CafeteriasService } from './cafeterias.service';

describe('CafeteriasService', () => {
  let service: CafeteriasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CafeteriasService],
    }).compile();

    service = module.get<CafeteriasService>(CafeteriasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
