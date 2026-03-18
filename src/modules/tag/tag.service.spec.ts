import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { TagService } from './tag.service';
import { TagRepository } from './tag.repository';
import { SharedService } from '../../common/shared.service';

describe('TagService', () => {
  let service: TagService;

  const mockTagRepository = {
    findAll: jest.fn(),
    searchByName: jest.fn(),
  };

  const mockSharedService = {
    normalizedLimitAndOffset: jest.fn((limit: number, offset: number) => ({ limit, offset })),
    getSharedMessage: jest.fn((key: string) => key),
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
        {
          provide: SharedService,
          useValue: mockSharedService,
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
        itemCount: 10,
        pageNumber: 6,
        totalItems: 12,
      },
    });
  });

  it('should use default pagination when params are missing', async () => {
    mockTagRepository.findAll.mockResolvedValue([[], 0]);

    await service.findAll();

    expect(mockSharedService.normalizedLimitAndOffset).toHaveBeenCalledWith(
      DEFAULT_LIMIT,
      DEFAULT_OFFSET,
      100,
    );
    expect(mockTagRepository.findAll).toHaveBeenCalledWith(DEFAULT_LIMIT, DEFAULT_OFFSET);
  });

  it('should search tags by keyword', async () => {
    mockTagRepository.searchByName.mockResolvedValue([[{ id: 1, name: 'nestjs' }], 1]);

    const result = await service.searchByName('nest', 10, 2);

    expect(mockTagRepository.searchByName).toHaveBeenCalledWith('nest', 10, 2);
    expect(result).toEqual({
      tags: ['nestjs'],
      page: {
        itemCount: 10,
        pageNumber: 3,
        totalItems: 1,
      },
    });
  });

  it('should throw BadRequestException for empty keyword', async () => {
    await expect(service.searchByName('   ')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockTagRepository.searchByName).not.toHaveBeenCalled();
  });
});
