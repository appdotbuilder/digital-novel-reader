
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable } from '../db/schema';
import { getNovelById } from '../handlers/get_novel_by_id';

describe('getNovelById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a novel by id', async () => {
    // Create test author first
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Test bio',
        image_url: null
      })
      .returning()
      .execute();

    const author = authorResult[0];

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel description',
        author_id: author.id,
        cover_image_url: 'https://example.com/cover.jpg',
        status: 'ongoing',
        is_featured: true,
        total_chapters: 5,
        total_views: 100
      })
      .returning()
      .execute();

    const createdNovel = novelResult[0];

    const result = await getNovelById(createdNovel.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdNovel.id);
    expect(result!.title).toEqual('Test Novel');
    expect(result!.description).toEqual('A test novel description');
    expect(result!.author_id).toEqual(author.id);
    expect(result!.cover_image_url).toEqual('https://example.com/cover.jpg');
    expect(result!.status).toEqual('ongoing');
    expect(result!.is_featured).toEqual(true);
    expect(result!.total_chapters).toEqual(5);
    expect(result!.total_views).toEqual(100);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent novel', async () => {
    const result = await getNovelById(999);
    expect(result).toBeNull();
  });

  it('should handle novel with null cover image', async () => {
    // Create test author first
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: null,
        image_url: null
      })
      .returning()
      .execute();

    const author = authorResult[0];

    // Create test novel with null cover_image_url
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Novel Without Cover',
        description: 'A novel without cover image',
        author_id: author.id,
        cover_image_url: null,
        status: 'draft',
        is_featured: false,
        total_chapters: 0,
        total_views: 0
      })
      .returning()
      .execute();

    const createdNovel = novelResult[0];

    const result = await getNovelById(createdNovel.id);

    expect(result).toBeDefined();
    expect(result!.cover_image_url).toBeNull();
    expect(result!.status).toEqual('draft');
    expect(result!.is_featured).toEqual(false);
    expect(result!.total_chapters).toEqual(0);
    expect(result!.total_views).toEqual(0);
  });
});
