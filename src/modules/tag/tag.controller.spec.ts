import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

describe('TagController', () => {
  let controller: TagController;

  const mockTagService = {
    findAll: jest.fn(),
    searchByName: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();

    controller = module.get<TagController>(TagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all tags', async () => {
    const expected = {
      tags: ['nestjs', 'typescript'],
      page: { itemCount: 10, pageNumber: 6, totalItems: 12 },
    };
    mockTagService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(10, 5);

    expect(mockTagService.findAll).toHaveBeenCalledWith(10, 5);
    expect(result).toEqual(expected);
  });

  it('should search tags by keyword', async () => {
    const expected = {
      tags: ['nestjs'],
      page: { itemCount: 20, pageNumber: 1, totalItems: 1 },
    };
    mockTagService.searchByName.mockResolvedValue(expected);

    const result = await controller.searchByName('nest', 20, 0);

    expect(mockTagService.searchByName).toHaveBeenCalledWith('nest', 20, 0);
    expect(result).toEqual(expected);
  });
});
