import { Test, TestingModule } from '@nestjs/testing';
import { BudController } from './bud.controller';

describe('BudController', () => {
  let controller: BudController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudController],
    }).compile();

    controller = module.get<BudController>(BudController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
