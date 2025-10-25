import { Test, TestingModule } from '@nestjs/testing';
import { CafeteriasController } from './cafeterias.controller';
import { CafeteriasService } from './cafeterias.service';

describe('CafeteriasController', () => {
  let controller: CafeteriasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CafeteriasController],
      providers: [CafeteriasService],
    }).compile();

    controller = module.get<CafeteriasController>(CafeteriasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
