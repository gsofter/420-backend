import { Test, TestingModule } from '@nestjs/testing';
import { BudService } from './bud.service';

describe('BudService', () => {
  let service: BudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BudService],
    }).compile();

    service = module.get<BudService>(BudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
