import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../common/constants';
import { SharedService } from '../../common/shared.service';
import { ArticleService } from './article.service';
import { ArticleRepository } from './article.repository';
import { UsersService } from '../users/users.service';
import { TagService } from '../tag/tag.service';

describe('ArticleService', () => {
  let service: ArticleService;
  const mockArticleRepository = {
    findAll: jest.fn(),
    findFeedByUserId: jest.fn(),
    findBySlug: jest.fn(),
    createArticle: jest.fn(),
    updateArticle: jest.fn(),
    remove: jest.fn(),
    isArticleFavoritedByUser: jest.fn(),
    favorite: jest.fn(),
    unfavorite: jest.fn(),
  };
  const mockTagService = {
    findTagsByNames: jest.fn(),
  };
  const mockUsersService = {
    checkUserExistOrThrow: jest.fn(),
  };
  const mockSharedService = {
    getSharedMessage: jest.fn((key: string) => key),
    normalizedLimitAndOffset: jest.fn((limit: number, offset: number) => ({
      limit,
      offset,
    })),
    buildSlug: jest.fn((id: number, title: string) => {
      const normalizedTitle = String(title || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      return `${id}-${normalizedTitle}`;
    }),
  };
  
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: mockArticleRepository,
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
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();
    service = module.get<ArticleService>(ArticleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return wrapped articles list with page metadata', async () => {
      mockArticleRepository.findAll.mockResolvedValue([
        [
          {
            id: 2,
            title: 'Article 2',
            description: 'Description 2',
            body: 'Body 2',
            tags: [{ name: 'nestjs' }],
            favoritedBy: [],
            author: { id: 1, username: 'john', bio: null, avatar: null },
          },
        ],
        9,
      ]);
      const query = {
        tag: 'nestjs',
        author: 'john_doe',
        favorited: 'jane_doe',
        itemCount: 10,
        page: 5,
      };
      const result = await service.findAll(query, 7);
      expect(mockArticleRepository.findAll).toHaveBeenCalledWith(query);
      expect(mockSharedService.normalizedLimitAndOffset).toHaveBeenCalledWith(
        10,
        5,
        20,
      );
      expect(result.page).toEqual({
        itemCount: 10,
        pageNumber: 6,
        totalItems: 9,
      });
      expect(result.articles[0]).toMatchObject({
        id: 2,
        title: 'Article 2',
        tagList: ['nestjs'],
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'john',
          bio: null,
          image: null,
          following: false,
        },
      });
    });

    it('should fallback to common constants when pagination is missing', async () => {
      mockArticleRepository.findAll.mockResolvedValue([[], 0]);
      await service.findAll({});
      expect(mockSharedService.normalizedLimitAndOffset).toHaveBeenCalledWith(
        DEFAULT_LIMIT,
        DEFAULT_OFFSET,
        20,
      );
      expect(mockArticleRepository.findAll).toHaveBeenCalledWith({
        itemCount: DEFAULT_LIMIT,
        page: DEFAULT_OFFSET,
      });
    });
  });

  describe('findFeed', () => {
    it('should return wrapped feed articles list with page metadata', async () => {
      mockArticleRepository.findFeedByUserId.mockResolvedValue([
        [
          {
            id: 3,
            title: 'Feed Article',
            description: 'Description 3',
            body: 'Body 3',
            tags: [{ name: 'feed' }],
            favoritedBy: [],
            author: { id: 2, username: 'jane', bio: null, avatar: null },
          },
        ],
        1,
      ]);
      const result = await service.findFeed(10, 2, 7);
      expect(mockSharedService.normalizedLimitAndOffset).toHaveBeenCalledWith(
        10,
        2,
        20,
      );
      expect(mockArticleRepository.findFeedByUserId).toHaveBeenCalledWith(
        7,
        10,
        2,
      );
      expect(result.page).toEqual({
        itemCount: 10,
        pageNumber: 3,
        totalItems: 1,
      });
      expect(result.articles[0]).toMatchObject({
        id: 3,
        title: 'Feed Article',
      });
    });

    it('should fallback to default pagination values', async () => {
      mockArticleRepository.findFeedByUserId.mockResolvedValue([[], 0]);
      await service.findFeed(undefined, undefined, 7);
      expect(mockSharedService.normalizedLimitAndOffset).toHaveBeenCalledWith(
        DEFAULT_LIMIT,
        DEFAULT_OFFSET,
        20,
      );
      expect(mockArticleRepository.findFeedByUserId).toHaveBeenCalledWith(
        7,
        DEFAULT_LIMIT,
        DEFAULT_OFFSET,
      );
    });
  });

  describe('findOne', () => {
    it('should return article when exists', async () => {
      const article = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [{ id: 1 }, { id: 9 }],
        author: { id: 1 },
      };
      mockArticleRepository.findBySlug.mockResolvedValue(article);
      const result = await service.findOne('1-article-1', 1);
      expect(mockArticleRepository.findBySlug).toHaveBeenCalledWith(
        '1-article-1',
      );
      expect(result).toEqual({
        article: {
          id: 1,
          slug: '1-article-1',
          title: 'Article 1',
          description: 'Description',
          body: 'Body',
          tagList: [],
          favorited: true,
          favoritesCount: 2,
          author: {
            username: undefined,
            bio: undefined,
            image: undefined,
            following: false,
          },
        },
      });
    });

    it('should throw NotFoundException when article does not exist', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);
      await expect(service.findOne('1-article-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when slug format is invalid', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);
      await expect(service.findOne('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockArticleRepository.findBySlug).toHaveBeenCalledWith(
        'invalid-slug',
      );
    });

    it('should return article when repository finds by provided slug', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue({
        id: 1,
        slug: '1-another-title',
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [],
        author: { id: 1 },
      });
      await expect(service.findOne('1-another-title')).resolves.toEqual({
        article: {
          id: 1,
          slug: '1-another-title',
          title: 'Article 1',
          description: 'Description',
          body: 'Body',
          tagList: [],
          favorited: false,
          favoritesCount: 0,
          author: {
            username: undefined,
            bio: undefined,
            image: undefined,
            following: false,
          },
        },
      });
    });
  });

  describe('create', () => {
    it('should create and return wrapped article', async () => {
      const createDto = {
        title: 'New article',
        description: 'Short description',
        body: 'Content',
        tagList: ['nestjs'],
      };
      mockUsersService.checkUserExistOrThrow.mockResolvedValue(undefined);
      mockTagService.findTagsByNames.mockResolvedValue([
        { id: 1, name: 'nestjs' },
      ]);
      mockArticleRepository.createArticle.mockResolvedValue({
        id: 10,
        ...createDto,
        tags: [{ name: 'nestjs' }],
        favoritedBy: [{ id: 2 }],
        author: { id: 1, username: 'john', bio: null, avatar: null },
      });
      const result = await service.create(1, createDto);
      expect(mockUsersService.checkUserExistOrThrow).toHaveBeenCalledWith(1);
      expect(mockTagService.findTagsByNames).toHaveBeenCalledWith(['nestjs']);
      expect(mockArticleRepository.createArticle).toHaveBeenCalledWith(
        1,
        createDto,
        [{ id: 1, name: 'nestjs' }],
      );
      expect(result.article).toMatchObject({
        id: 10,
        title: 'New article',
        favorited: false,
        favoritesCount: 1,
      });
    });

    it('should throw NotFoundException when author does not exist', async () => {
      mockUsersService.checkUserExistOrThrow.mockRejectedValue(
        new NotFoundException('not found'),
      );
      await expect(
        service.create(99, {
          title: 'New article',
          description: 'Short description',
          body: 'Content',
          tagList: [],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockArticleRepository.createArticle).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when some tags do not exist', async () => {
      mockUsersService.checkUserExistOrThrow.mockResolvedValue(undefined);
      mockTagService.findTagsByNames.mockResolvedValue([
        { id: 1, name: 'nestjs' },
      ]);
      await expect(
        service.create(1, {
          title: 'New article',
          description: 'Short description',
          body: 'Content',
          tagList: ['nestjs', 'unknown-tag'],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockArticleRepository.createArticle).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update when requester is author', async () => {
      const existing = {
        id: 1,
        title: 'Old title',
        description: 'Old description',
        body: 'Old body',
        tags: [],
        favoritedBy: [],
        author: { id: 5, username: 'john', bio: null, avatar: null },
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockTagService.findTagsByNames.mockResolvedValue([
        { id: 2, name: 'backend' },
      ]);
      mockArticleRepository.updateArticle.mockResolvedValue({
        ...existing,
        title: 'New title',
        tags: [{ id: 2, name: 'backend' }],
      });
      const result = await service.update('1-old-title', 5, {
        title: 'New title',
        tagList: ['backend'],
      });
      expect(mockArticleRepository.updateArticle).toHaveBeenCalledWith(
        existing,
        {
          title: 'New title',
          tagList: ['backend'],
        },
        [{ id: 2, name: 'backend' }],
      );
      expect(result.article.title).toBe('New title');
    });

    it('should throw ForbiddenException when requester is not author', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue({
        id: 1,
        title: 'Old title',
        description: 'Old description',
        body: 'Old body',
        tags: [],
        favoritedBy: [],
        author: { id: 5 },
      });
      await expect(
        service.update('1-old-title', 6, { title: 'New title' }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockArticleRepository.updateArticle).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when update tag list contains invalid tag', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue({
        id: 1,
        title: 'Old title',
        description: 'Old description',
        body: 'Old body',
        tags: [],
        favoritedBy: [],
        author: { id: 5 },
      });
      mockTagService.findTagsByNames.mockResolvedValue([
        { id: 2, name: 'backend' },
      ]);
      await expect(
        service.update('1-old-title', 5, {
          tagList: ['backend', 'missing-tag'],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockArticleRepository.updateArticle).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove when requester is author', async () => {
      const existing = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [],
        author: { id: 3 },
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockArticleRepository.remove.mockResolvedValue(existing);
      const result = await service.remove('1-article-1', 3);
      expect(mockArticleRepository.remove).toHaveBeenCalledWith(existing);
      expect(result).toEqual({ message: 'message.ARTICLE_DELETE_SUCCESS' });
    });

    it('should throw ForbiddenException when requester is not author', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue({
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [],
        author: { id: 3 },
      });
      await expect(service.remove('1-article-1', 4)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockArticleRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when remove operation fails', async () => {
      const existing = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [],
        author: { id: 3 },
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockArticleRepository.remove.mockRejectedValue(new Error('DB error'));
      await expect(service.remove('1-article-1', 3)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('favorite', () => {
    it('should favorite article and return serialized detail', async () => {
      const existing = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [],
        author: { id: 3, username: 'john', bio: null, avatar: null },
      };
      const favorited = {
        ...existing,
        favoritedBy: [{ id: 7 }],
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockArticleRepository.isArticleFavoritedByUser.mockResolvedValue(false);
      mockArticleRepository.favorite.mockResolvedValue(favorited);
      const result = await service.favorite('1-article-1', 7);
      expect(
        mockArticleRepository.isArticleFavoritedByUser,
      ).toHaveBeenCalledWith(1, 7);
      expect(mockArticleRepository.favorite).toHaveBeenCalledWith(existing, 7);
      expect(result.article).toMatchObject({
        id: 1,
        favorited: true,
        favoritesCount: 1,
      });
    });

    it('should throw NotFoundException when article does not exist', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);
      await expect(service.favorite('missing-slug', 7)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockArticleRepository.favorite).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when favorite operation fails', async () => {
      const existing = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [],
        author: { id: 3 },
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockArticleRepository.isArticleFavoritedByUser.mockResolvedValue(false);
      mockArticleRepository.favorite.mockRejectedValue(new Error('DB error'));
      await expect(service.favorite('1-article-1', 7)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('unfavorite', () => {
    it('should unfavorite article and return serialized detail', async () => {
      const existing = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [{ id: 7 }],
        author: { id: 3, username: 'john', bio: null, avatar: null },
      };
      const unfavorited = {
        ...existing,
        favoritedBy: [],
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockArticleRepository.isArticleFavoritedByUser.mockResolvedValue(true);
      mockArticleRepository.unfavorite.mockResolvedValue(unfavorited);
      const result = await service.unfavorite('1-article-1', 7);
      expect(
        mockArticleRepository.isArticleFavoritedByUser,
      ).toHaveBeenCalledWith(1, 7);
      expect(mockArticleRepository.unfavorite).toHaveBeenCalledWith(
        existing,
        7,
      );
      expect(result.article).toMatchObject({
        id: 1,
        favorited: false,
        favoritesCount: 0,
      });
    });

    it('should throw NotFoundException when article does not exist', async () => {
      mockArticleRepository.findBySlug.mockResolvedValue(null);
      await expect(service.unfavorite('missing-slug', 7)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockArticleRepository.unfavorite).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when unfavorite operation fails', async () => {
      const existing = {
        id: 1,
        title: 'Article 1',
        description: 'Description',
        body: 'Body',
        tags: [],
        favoritedBy: [{ id: 7 }],
        author: { id: 3 },
      };
      mockArticleRepository.findBySlug.mockResolvedValue(existing);
      mockArticleRepository.isArticleFavoritedByUser.mockResolvedValue(true);
      mockArticleRepository.unfavorite.mockRejectedValue(new Error('DB error'));
      await expect(service.unfavorite('1-article-1', 7)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
