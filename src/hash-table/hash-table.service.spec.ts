import { Test, TestingModule } from '@nestjs/testing';
import { HashTableService } from './hash-table.service';

describe('HashTableService', () => {
  let service: HashTableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashTableService],
    }).compile();

    service = module.get<HashTableService>(HashTableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
