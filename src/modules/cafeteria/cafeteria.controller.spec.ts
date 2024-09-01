import { Test, TestingModule } from '@nestjs/testing';
import { CafeteriaController } from './cafeteria.controller';
import { CafeteriaService } from './cafeteria.service';

describe('CafeteriaController', () => {
  let controller: CafeteriaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CafeteriaController],
      providers: [CafeteriaService],
    }).compile();

    controller = module.get<CafeteriaController>(CafeteriaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
