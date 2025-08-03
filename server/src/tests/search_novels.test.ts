
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, genresTable, novelsTable, novelGenresTable } from '../db/schema';
import { type SearchNovelsInput } from '../schema';
import { searchNovels } from '../handlers/search_novels';

describe('searchNovels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  const setupTestData = async () => {
    // Create author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();
    const author = authorResult[0];

    // Create another author
    const author2Result = await db.insert(authorsTable)
      .values({
        name: 'Another Author',
        bio: 'Another test author',
        image_url: null
      })
      .returning()
      .execute();
    const author2 = author2Result[0];

    // Create genres
    const genreResult = await db.insert(genresTable)
      .values([
        { name: 'Fantasy', description: 'Fantasy novels' },
        { name: 'Romance', description: 'Romance novels' }
      ])
      .returning()
      .execute();
    const [fantasyGenre, romanceGenre] = genreResult;

    // Create novels
    const novelsResult = await db.insert(novelsTable)
      .values([
        {
          title: 'Fantasy Adventure',
          description: 'An epic fantasy novel',
          author_id: author.id,
          status: 'ongoing',
          is_featured: true,
          total_chapters: 10,
          total_views: 1000
        },
        {
          title: 'Romance Story',
          description: 'A heartwarming romance',
          author_id: author2.id,
          status: 'completed',
          is_featured: false,
          total_chapters: 5,
          total_views: 500
        },
        {
          title: 'Mystery Tale',
          description: 'A mysterious story',
          author_id: author.id,
          status: 'hiatus',
          is_featured: false,
          total_chapters: 3,
          total_views: 200
        }
      ])
      .returning()
      .execute();

    // Add genre relationships
    await db.insert(novelGenresTable)
      .values([
        { novel_id: novelsResult[0].id, genre_id: fantasyGenre.id },
        { novel_id: novelsResult[1].id, genre_id: romanceGenre.id }
      ])
      .execute();

    return {
      author,
      author2,
      fantasyGenre,
      romanceGenre,
      novels: novelsResult
    };
  };

  it('should return all novels when no filters provided', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {};
    const results = await searchNovels(input);

    expect(results).toHaveLength(3);
    expect(results[0].title).toBeDefined();
    expect(results[0].description).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should search novels by title', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {
      query: 'Fantasy'
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Fantasy Adventure');
  });

  it('should search novels by author name', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {
      query: 'Another Author'
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Romance Story');
  });

  it('should filter novels by status', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {
      status: 'completed'
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Romance Story');
    expect(results[0].status).toEqual('completed');
  });

  it('should filter novels by author_id', async () => {
    const testData = await setupTestData();

    const input: SearchNovelsInput = {
      author_id: testData.author.id
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(2);
    results.forEach(novel => {
      expect(novel.author_id).toEqual(testData.author.id);
    });
  });

  it('should filter novels by genre_ids', async () => {
    const testData = await setupTestData();

    const input: SearchNovelsInput = {
      genre_ids: [testData.fantasyGenre.id]
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Fantasy Adventure');
  });

  it('should return empty array for non-existent genre', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {
      genre_ids: [9999] // Non-existent genre ID
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(0);
  });

  it('should apply pagination correctly', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {
      limit: 2,
      offset: 1
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(2);
  });

  it('should combine text search with status filter', async () => {
    const testData = await setupTestData();

    const input: SearchNovelsInput = {
      query: 'Test Author',
      status: 'ongoing'
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Fantasy Adventure');
    expect(results[0].author_id).toEqual(testData.author.id);
    expect(results[0].status).toEqual('ongoing');
  });

  it('should combine genre filter with text search', async () => {
    const testData = await setupTestData();

    const input: SearchNovelsInput = {
      query: 'Fantasy',
      genre_ids: [testData.fantasyGenre.id]
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Fantasy Adventure');
  });

  it('should handle empty results gracefully', async () => {
    await setupTestData();

    const input: SearchNovelsInput = {
      query: 'NonExistentNovel'
    };
    const results = await searchNovels(input);

    expect(results).toHaveLength(0);
  });
});
