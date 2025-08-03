
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { genresTable, authorsTable, novelsTable, novelGenresTable } from '../db/schema';
import { deleteGenre } from '../handlers/delete_genre';
import { eq } from 'drizzle-orm';

describe('deleteGenre', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a genre successfully', async () => {
    // Create a genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Test Genre',
        description: 'A test genre'
      })
      .returning()
      .execute();

    const genreId = genreResult[0].id;

    // Delete the genre
    const result = await deleteGenre(genreId);

    expect(result.success).toBe(true);

    // Verify genre is deleted
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, genreId))
      .execute();

    expect(genres).toHaveLength(0);
  });

  it('should throw error when genre does not exist', async () => {
    const nonExistentId = 999;

    expect(deleteGenre(nonExistentId)).rejects.toThrow(/genre not found/i);
  });

  it('should prevent deletion of genre used by novels', async () => {
    // Create prerequisite data
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author'
      })
      .returning()
      .execute();

    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Test Genre',
        description: 'A test genre'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: authorResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Associate genre with novel
    await db.insert(novelGenresTable)
      .values({
        novel_id: novelResult[0].id,
        genre_id: genreResult[0].id
      })
      .execute();

    // Attempt to delete genre used by novel
    expect(deleteGenre(genreResult[0].id)).rejects.toThrow(/cannot delete genre that is used by novels/i);

    // Verify genre still exists
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, genreResult[0].id))
      .execute();

    expect(genres).toHaveLength(1);
  });

  it('should delete genre that was previously used but no longer used', async () => {
    // Create prerequisite data
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author'
      })
      .returning()
      .execute();

    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Test Genre',
        description: 'A test genre'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: authorResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Associate genre with novel
    await db.insert(novelGenresTable)
      .values({
        novel_id: novelResult[0].id,
        genre_id: genreResult[0].id
      })
      .execute();

    // Remove the association
    await db.delete(novelGenresTable)
      .where(eq(novelGenresTable.genre_id, genreResult[0].id))
      .execute();

    // Now deletion should succeed
    const result = await deleteGenre(genreResult[0].id);

    expect(result.success).toBe(true);

    // Verify genre is deleted
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, genreResult[0].id))
      .execute();

    expect(genres).toHaveLength(0);
  });
});
