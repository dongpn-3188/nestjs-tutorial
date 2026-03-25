import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { SharedService } from '../../common/shared.service';
import { UsersService } from '../users/users.service';
import { ArticleService } from '../article/article.service';

describe('CommentService', () => {
  let service: CommentService;

  const mockComments = [
    {
      id: 1,
      body: 'comment 1',
      article: { id: 5 },
      author: { id: 1, username: 'abc' },
      createdAt: new Date('2024/06/01 12:00:00'),
      updatedAt: new Date('2024/06/01 12:00:00'),
    },
    {
      id: 2,
      body: 'comment 2',
      article: { id: 5 },
      author: { id: 3, username: 'xyz' },
      createdAt: new Date('2024/06/02 12:00:00'),
      updatedAt: new Date('2024/06/02 12:00:00'),
    },
  ];

  const mockCommentRepository = {
    findByArticleId: jest.fn().mockResolvedValue([mockComments, 2]),
    create: jest.fn().mockResolvedValue(mockComments[0]),
    findById: jest.fn().mockResolvedValue(mockComments[0]),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const mockSharedService = {
    getSharedMessage: jest.fn((key: string) => key),
    normalizedLimitAndOffset: jest.fn((limit: number, offset: number) => ({
      limit,
      offset,
    })),
  };

  const mockUsersService = {
    loadUserOrThrow: jest.fn().mockResolvedValue({ id: 1, username: 'abc' }),
  };

  const mockArticleService = {
    loadArticleBySlugOrThrow: jest.fn().mockResolvedValue({ id: 5 }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: CommentRepository,
          useValue: mockCommentRepository,
        },
        {
          provide: SharedService,
          useValue: mockSharedService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByArticleSlug', () => {
    it('should return paginated comments for a given article slug', async () => {
      const result = await service.findAllByArticleSlug('test-article', 10, 0);

      const expectedData = {
        comments: [
          {
            id: 1,
            body: 'comment 1',
            author: { id: 1, username: 'abc' },
            createdAt: new Date('2024/06/01 12:00:00'),
            updatedAt: new Date('2024/06/01 12:00:00'),
          },
          {
            id: 2,
            body: 'comment 2',
            author: { id: 3, username: 'xyz' },
            createdAt: new Date('2024/06/02 12:00:00'),
            updatedAt: new Date('2024/06/02 12:00:00'),
          },
        ],
        page: {
          itemCount: 10,
          pageNumber: 1,
          totalItems: 2,
        },
      };

      expect(mockArticleService.loadArticleBySlugOrThrow).toHaveBeenCalledWith('test-article');
      expect(mockSharedService.normalizedLimitAndOffset).toHaveBeenCalledWith(10, 0, 20);
      expect(mockCommentRepository.findByArticleId).toHaveBeenCalledWith(5, 10, 0);
      expect(result).toEqual(expectedData);
    });
  });

  describe('create', () => {
    it('should create comment successfully', async () => {
      const dto = { body: 'comment 3' };

      const result = await service.create('test-article', 1, dto);

      expect(mockArticleService.loadArticleBySlugOrThrow).toHaveBeenCalledWith('test-article');
      expect(mockUsersService.loadUserOrThrow).toHaveBeenCalledWith(1);
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        body: 'comment 3',
        article: { id: 5 },
        author: { id: 1, username: 'abc' },
      });
      expect(result).toEqual({
        comment: {
          id: 1,
          body: 'comment 1',
          author: { id: 1, username: 'abc' },
          createdAt: new Date('2024/06/01 12:00:00'),
          updatedAt: new Date('2024/06/01 12:00:00'),
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete comment successfully', async () => {
      const result = await service.remove('test-article', 1, 1);

      expect(mockArticleService.loadArticleBySlugOrThrow).toHaveBeenCalledWith(
        'test-article',
      );
      expect(mockCommentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCommentRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({});
    });

    it('should throw NotFoundException when comment is not found', async () => {
      mockCommentRepository.findById.mockResolvedValueOnce(null);

      await expect(service.remove('test-article', 999, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.COMMENT_NOT_FOUND',
      );
      expect(mockCommentRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when comment does not belong to article', async () => {
      mockArticleService.loadArticleBySlugOrThrow.mockResolvedValueOnce({ id: 10 });

      await expect(service.remove('test-article', 1, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.COMMENT_NOT_BELONG_TO_ARTICLE',
      );
      expect(mockCommentRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when requester is not comment author', async () => {
      await expect(service.remove('test-article', 1, 999)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.COMMENT_FORBIDDEN',
      );
      expect(mockCommentRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when repository delete fails', async () => {
      mockCommentRepository.delete.mockRejectedValueOnce(new Error('db error'));

      await expect(service.remove('test-article', 1, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockSharedService.getSharedMessage).toHaveBeenCalledWith(
        'message.COMMENT_DELETE_FAILED',
      );
    });
  });
});
