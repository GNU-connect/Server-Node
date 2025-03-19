import { Test, TestingModule } from '@nestjs/testing';
import { ClickerController } from './clickers.controller';
import { ClickerService } from './clickers.service';

describe('ClickerController', () => {
  let controller: ClickerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClickerController],
      providers: [ClickerService],
    }).compile();

    controller = module.get<ClickerController>(ClickerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
