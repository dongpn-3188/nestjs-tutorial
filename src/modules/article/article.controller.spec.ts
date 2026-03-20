import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

describe('ArticleController', () => {
  let controller: ArticleController;
  const mockArticleService = {
    findAll: jest.fn(),
    findFeed: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    favorite: jest.fn(),
    unfavorite: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    }).compile();
    controller = module.get<ArticleController>(ArticleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all articles', async () => {
    const expected = {
      articles: [{ id: 1, title: 'Article 1' }],
      articlesCount: 1,
    };
    mockArticleService.findAll.mockResolvedValue(expected);
    const req = { user: { userId: 99 } };
    const query = {
      tag: 'nestjs',
      author: 'john_doe',
      favorited: 'jane_doe',
      itemCount: 10,
      page: 5,
    };
    const result = await controller.findAll(query, req);
    expect(mockArticleService.findAll).toHaveBeenCalledWith(query, 99);
    expect(result).toEqual(expected);
  });

  it('should use default pagination when query params are missing', async () => {
    const expected = { articles: [], articlesCount: 0 };
    mockArticleService.findAll.mockResolvedValue(expected);
    const req = {};
    const result = await controller.findAll({}, req);
    expect(mockArticleService.findAll).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(expected);
  });

  it('should return article by slug', async () => {
    const expected = { article: { id: 1, title: 'Article 1' } };
    mockArticleService.findOne.mockResolvedValue(expected);
    const req = { user: { userId: 10 } };
    const slug = '1-article-1';
    const result = await controller.findOne(slug, req);
    expect(mockArticleService.findOne).toHaveBeenCalledWith(slug, 10);
    expect(result).toEqual(expected);
  });

  it('should return feed articles for current user', async () => {
    const expected = {
      articles: [{ id: 2, title: 'Article 2' }],
      articlesCount: 1,
    };
    mockArticleService.findFeed.mockResolvedValue(expected);
    const req = { user: { userId: 10 } };
    const result = await controller.findFeed(10, 0, req);
    expect(mockArticleService.findFeed).toHaveBeenCalledWith(10, 0, 10);
    expect(result).toEqual(expected);
  });

  it('should create article', async () => {
    const req = { user: { userId: 1 } };
    const createDto = {
      title: 'Article 1',
      description: 'Description 1',
      body: 'Body 1',
      tagList: ['nestjs'],
    };
    const expected = { article: { id: 1, ...createDto, authorId: 1 } };
    mockArticleService.create.mockResolvedValue(expected);
    const result = await controller.create(createDto, req);
    expect(mockArticleService.create).toHaveBeenCalledWith(1, createDto);
    expect(result).toEqual(expected);
  });

  it('should update article', async () => {
    const req = { user: { userId: 1 } };
    const slug = '1-article-1';
    const updateDto = { title: 'Updated title' };
    const expected = { article: { id: 1, title: 'Updated title' } };
    mockArticleService.update.mockResolvedValue(expected);
    const result = await controller.update(slug, updateDto, req);
    expect(mockArticleService.update).toHaveBeenCalledWith(slug, 1, updateDto);
    expect(result).toEqual(expected);
  });

  it('should remove article', async () => {
    const req = { user: { userId: 1 } };
    const slug = '1-article-1';
    const expected = { message: 'Article deleted successfully' };
    mockArticleService.remove.mockResolvedValue(expected);
    const result = await controller.remove(slug, req);
    expect(mockArticleService.remove).toHaveBeenCalledWith(slug, 1);
    expect(result).toEqual(expected);
  });

  it('should favorite article', async () => {
    const req = { user: { userId: 1 } };
    const slug = '1-article-1';
    const expected = {
      article: {
        id: 1,
        title: 'Article 1',
        favorited: true,
        favoritesCount: 1,
      },
    };
    mockArticleService.favorite.mockResolvedValue(expected);
    const result = await controller.favorite(slug, req);
    expect(mockArticleService.favorite).toHaveBeenCalledWith(slug, 1);
    expect(result).toEqual(expected);
  });

  it('should unfavorite article', async () => {
    const req = { user: { userId: 1 } };
    const slug = '1-article-1';
    const expected = {
      article: {
        id: 1,
        title: 'Article 1',
        favorited: false,
        favoritesCount: 0,
      },
    };
    mockArticleService.unfavorite.mockResolvedValue(expected);
    const result = await controller.unfavorite(slug, req);
    expect(mockArticleService.unfavorite).toHaveBeenCalledWith(slug, 1);
    expect(result).toEqual(expected);
  });
});
