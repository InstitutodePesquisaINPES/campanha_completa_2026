import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CampanhasService } from './campanhas.service';

describe('CampanhasService', () => {
  let service: CampanhasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampanhasService, PrismaService],
    }).compile();

    service = module.get<CampanhasService>(CampanhasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
