import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

describe('TagController', () => {
  let controller: TagController;

  const mockTagService = {
    findAll: jest.fn(),
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
      page: { limit: 10, offset: 5, total: 12 },
    };
    mockTagService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(10, 5);

    expect(mockTagService.findAll).toHaveBeenCalledWith(10, 5);
    expect(result).toEqual(expected);
  });
});
