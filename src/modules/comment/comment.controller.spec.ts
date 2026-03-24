import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

describe('CommentController', () => {
  let controller: CommentController;

  const mockComments = [
    {
      id: 1,
      body: 'comment 1',
      author: { id: 2, username: 'def' },
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
  ];

  const mockCommentService = {
    findAllByArticleSlug: jest.fn().mockResolvedValue({
      comments: mockComments,
      page: {
        itemCount: 20,
        pageNumber: 1,
        totalItems: 2,
      },
    }),
    create: jest.fn().mockResolvedValue({
      comment: mockComments[0],
    }),
    remove: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
      ],
    }).compile();

    controller = module.get<CommentController>(CommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getComments', () => {
    it('should return a list comments of an article with pagination', async () => {
      const result = await controller.getComments('test-article', 20, 0);

      expect(mockCommentService.findAllByArticleSlug).toHaveBeenCalledWith('test-article', 20, 0);
      expect(result).toEqual({
        comments: mockComments,
        page: {
          itemCount: 20,
          pageNumber: 1,
          totalItems: 2,
        },
      });
    });
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const dto = { body: 'new comment' };
      const req = { user: { userId: 1 } };

      const result = await controller.createComment('test-article', dto, req);

      expect(mockCommentService.create).toHaveBeenCalledWith('test-article', 1, dto);
      expect(result).toEqual({
        comment: mockComments[0],
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      const req = { user: { userId: 1 } };

      const result = await controller.deleteComment('test-article', 10, req);

      expect(mockCommentService.remove).toHaveBeenCalledWith(
        'test-article',
        10,
        1,
      );
      expect(result).toEqual({});
    });
  });
});
