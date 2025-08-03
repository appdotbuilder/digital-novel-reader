
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { novelsTable, novelGenresTable, authorsTable, genresTable } from '../db/schema';
import { type CreateNovelInput } from '../schema';
import { createNovel } from '../handlers/create_novel';
import { eq, and } from 'drizzle-orm';

describe('createNovel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a novel', async () => {
    // Create prerequisite author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();

    const testInput: CreateNovelInput = {
      title: 'Test Novel',
      description: 'A novel for testing',
      author_id: authorResult[0].id,
      cover_image_url: 'https://example.com/cover.jpg',
      status: 'draft',
      is_featured: false
    };

    const result = await createNovel(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Novel');
    expect(result.description).toEqual(testInput.description);
    expect(result.author_id).toEqual(authorResult[0].id);
    expect(result.cover_image_url).toEqual('https://example.com/cover.jpg');
    expect(result.status).toEqual('draft');
    expect(result.is_featured).toEqual(false);
    expect(result.total_chapters).toEqual(0);
    expect(result.total_views).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save novel to database', async () => {
    // Create prerequisite author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();

    const testInput: CreateNovelInput = {
      title: 'Test Novel',
      description: 'A novel for testing',
      author_id: authorResult[0].id,
      status: 'ongoing',
      is_featured: true
    };

    const result = await createNovel(testInput);

    // Query to verify data was saved
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, result.id))
      .execute();

    expect(novels).toHaveLength(1);
    expect(novels[0].title).toEqual('Test Novel');
    expect(novels[0].description).toEqual(testInput.description);
    expect(novels[0].author_id).toEqual(authorResult[0].id);
    expect(novels[0].status).toEqual('ongoing');
    expect(novels[0].is_featured).toEqual(true);
    expect(novels[0].created_at).toBeInstanceOf(Date);
  });

  it('should create novel with genre associations', async () => {
    // Create prerequisite author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();

    // Create prerequisite genres
    const genreResults = await db.insert(genresTable)
      .values([
        { name: 'Fantasy', description: 'Fantasy genre' },
        { name: 'Adventure', description: 'Adventure genre' }
      ])
      .returning()
      .execute();

    const testInput: CreateNovelInput = {
      title: 'Fantasy Adventure',
      description: 'A fantasy adventure novel',
      author_id: authorResult[0].id,
      status: 'ongoing',
      is_featured: false,
      genre_ids: [genreResults[0].id, genreResults[1].id]
    };

    const result = await createNovel(testInput);

    // Verify novel was created
    expect(result.title).toEqual('Fantasy Adventure');
    expect(result.author_id).toEqual(authorResult[0].id);

    // Verify genre associations were created
    const genreAssociations = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, result.id))
      .execute();

    expect(genreAssociations).toHaveLength(2);
    expect(genreAssociations.map(g => g.genre_id).sort()).toEqual([genreResults[0].id, genreResults[1].id].sort());
  });

  it('should throw error when author does not exist', async () => {
    const testInput: CreateNovelInput = {
      title: 'Test Novel',
      description: 'A novel for testing',
      author_id: 999, // Non-existent author
      status: 'draft',
      is_featured: false
    };

    await expect(createNovel(testInput)).rejects.toThrow(/Author with id 999 does not exist/i);
  });

  it('should apply default values correctly', async () => {
    // Create prerequisite author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();

    const testInput: CreateNovelInput = {
      title: 'Minimal Novel',
      description: 'Minimal test novel',
      author_id: authorResult[0].id,
      status: 'completed'
      // Omitting optional fields to test defaults
    };

    const result = await createNovel(testInput);

    expect(result.cover_image_url).toBeNull();
    expect(result.is_featured).toEqual(false);
    expect(result.total_chapters).toEqual(0);
    expect(result.total_views).toEqual(0);
  });
});
