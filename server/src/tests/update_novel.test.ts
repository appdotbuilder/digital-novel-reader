
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { novelsTable, authorsTable, genresTable, novelGenresTable } from '../db/schema';
import { type UpdateNovelInput } from '../schema';
import { updateNovel } from '../handlers/update_novel';
import { eq } from 'drizzle-orm';

describe('updateNovel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testAuthorId: number;
  let testNovelId: number;
  let testGenreIds: number[];

  beforeEach(async () => {
    // Create test author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Test bio',
        image_url: null
      })
      .returning()
      .execute();
    testAuthorId = authorResult[0].id;

    // Create test genres
    const genreResults = await db.insert(genresTable)
      .values([
        { name: 'Fantasy', description: 'Fantasy genre' },
        { name: 'Adventure', description: 'Adventure genre' },
        { name: 'Romance', description: 'Romance genre' }
      ])
      .returning()
      .execute();
    testGenreIds = genreResults.map(g => g.id);

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        author_id: testAuthorId,
        cover_image_url: 'original-cover.jpg',
        status: 'draft',
        is_featured: false,
        total_chapters: 5,
        total_views: 100
      })
      .returning()
      .execute();
    testNovelId = novelResult[0].id;

    // Add initial genre associations
    await db.insert(novelGenresTable)
      .values([
        { novel_id: testNovelId, genre_id: testGenreIds[0] },
        { novel_id: testNovelId, genre_id: testGenreIds[1] }
      ])
      .execute();
  });

  it('should update novel basic fields', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Updated Title',
      description: 'Updated description',
      status: 'ongoing',
      is_featured: true
    };

    const result = await updateNovel(input);

    expect(result.id).toEqual(testNovelId);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('ongoing');
    expect(result.is_featured).toEqual(true);
    expect(result.author_id).toEqual(testAuthorId); // Should remain unchanged
    expect(result.total_chapters).toEqual(5); // Should remain unchanged
    expect(result.total_views).toEqual(100); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update novel author', async () => {
    // Create another author
    const newAuthorResult = await db.insert(authorsTable)
      .values({
        name: 'New Author',
        bio: 'New author bio',
        image_url: null
      })
      .returning()
      .execute();

    const input: UpdateNovelInput = {
      id: testNovelId,
      author_id: newAuthorResult[0].id
    };

    const result = await updateNovel(input);

    expect(result.author_id).toEqual(newAuthorResult[0].id);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should update cover image url to null', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      cover_image_url: null
    };

    const result = await updateNovel(input);

    expect(result.cover_image_url).toBeNull();
  });

  it('should update genre associations', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      genre_ids: [testGenreIds[2]] // Only Romance genre
    };

    await updateNovel(input);

    // Verify genre associations updated
    const genres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, testNovelId))
      .execute();

    expect(genres).toHaveLength(1);
    expect(genres[0].genre_id).toEqual(testGenreIds[2]);
  });

  it('should clear all genre associations when empty array provided', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      genre_ids: []
    };

    await updateNovel(input);

    // Verify all genre associations removed
    const genres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, testNovelId))
      .execute();

    expect(genres).toHaveLength(0);
  });

  it('should add multiple new genre associations', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      genre_ids: testGenreIds // All three genres
    };

    await updateNovel(input);

    // Verify all genre associations added
    const genres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, testNovelId))
      .execute();

    expect(genres).toHaveLength(3);
    const genreIds = genres.map(g => g.genre_id).sort();
    expect(genreIds).toEqual(testGenreIds.sort());
  });

  it('should save changes to database', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Database Test Title',
      status: 'completed'
    };

    await updateNovel(input);

    // Verify changes persisted
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, testNovelId))
      .execute();

    expect(novels).toHaveLength(1);
    expect(novels[0].title).toEqual('Database Test Title');
    expect(novels[0].status).toEqual('completed');
  });

  it('should update only provided fields', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Partial Update'
    };

    const result = await updateNovel(input);

    expect(result.title).toEqual('Partial Update');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('draft');
    expect(result.is_featured).toEqual(false);
  });

  it('should throw error when novel not found', async () => {
    const input: UpdateNovelInput = {
      id: 99999,
      title: 'Non-existent Novel'
    };

    expect(updateNovel(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when author not found', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      author_id: 99999
    };

    expect(updateNovel(input)).rejects.toThrow(/author.*not found/i);
  });

  it('should preserve genre associations when not updating them', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Title Update Only'
    };

    await updateNovel(input);

    // Verify original genre associations preserved
    const genres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, testNovelId))
      .execute();

    expect(genres).toHaveLength(2);
    const genreIds = genres.map(g => g.genre_id).sort();
    expect(genreIds).toEqual([testGenreIds[0], testGenreIds[1]].sort());
  });
});
