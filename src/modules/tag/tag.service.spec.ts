import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';

describe('TagService', () => {
  let service: TagService;

  const mockTagRepository = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: TagRepository,
          useValue: mockTagRepository,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return tags in response wrapper', async () => {
    mockTagRepository.findAll.mockResolvedValue([
      [
        { id: 1, name: 'nestjs' },
        { id: 2, name: 'typescript' },
      ],
      12,
    ]);

    const result = await service.findAll(10, 5);

    expect(mockTagRepository.findAll).toHaveBeenCalledWith(10, 5);
    expect(result).toEqual({
      tags: ['nestjs', 'typescript'],
      page: {
        limit: 10,
        offset: 5,
        total: 12,
      },
    });
  });

  it('should use default pagination when params are missing', async () => {
    mockTagRepository.findAll.mockResolvedValue([[], 0]);

    await service.findAll();

    expect(mockTagRepository.findAll).toHaveBeenCalledWith(DEFAULT_LIMIT, DEFAULT_OFFSET);
  });
});
