
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  novelsTable, 
  chaptersTable, 
  novelGenresTable, 
  readingHistoryTable,
  authorsTable,
  usersTable,
  genresTable
} from '../db/schema';
import { deleteNovel } from '../handlers/delete_novel';
import { eq } from 'drizzle-orm';

describe('deleteNovel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a novel', async () => {
    // Create prerequisite data
    const [author] = await db.insert(authorsTable)
      .values({ name: 'Test Author' })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Delete the novel
    const result = await deleteNovel(novel.id);

    expect(result.success).toBe(true);

    // Verify novel is deleted
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novel.id))
      .execute();

    expect(novels).toHaveLength(0);
  });

  it('should cascade delete chapters', async () => {
    // Create prerequisite data
    const [author] = await db.insert(authorsTable)
      .values({ name: 'Test Author' })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Create chapters
    await db.insert(chaptersTable)
      .values([
        {
          novel_id: novel.id,
          title: 'Chapter 1',
          content: 'Content 1',
          chapter_number: 1
        },
        {
          novel_id: novel.id,
          title: 'Chapter 2',
          content: 'Content 2',
          chapter_number: 2
        }
      ])
      .execute();

    // Delete the novel
    const result = await deleteNovel(novel.id);

    expect(result.success).toBe(true);

    // Verify chapters are deleted
    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.novel_id, novel.id))
      .execute();

    expect(chapters).toHaveLength(0);
  });

  it('should cascade delete genre associations', async () => {
    // Create prerequisite data
    const [author] = await db.insert(authorsTable)
      .values({ name: 'Test Author' })
      .returning()
      .execute();

    const [genre] = await db.insert(genresTable)
      .values({ name: 'Fantasy' })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Create genre association
    await db.insert(novelGenresTable)
      .values({
        novel_id: novel.id,
        genre_id: genre.id
      })
      .execute();

    // Delete the novel
    const result = await deleteNovel(novel.id);

    expect(result.success).toBe(true);

    // Verify genre associations are deleted
    const novelGenres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, novel.id))
      .execute();

    expect(novelGenres).toHaveLength(0);
  });

  it('should cascade delete reading history', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    const [author] = await db.insert(authorsTable)
      .values({ name: 'Test Author' })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'draft'
      })
      .returning()
      .execute();

    const [chapter] = await db.insert(chaptersTable)
      .values({
        novel_id: novel.id,
        title: 'Chapter 1',
        content: 'Content 1',
        chapter_number: 1
      })
      .returning()
      .execute();

    // Create reading history
    await db.insert(readingHistoryTable)
      .values({
        user_id: user.id,
        novel_id: novel.id,
        chapter_id: chapter.id,
        progress_percentage: '50.00'
      })
      .execute();

    // Delete the novel
    const result = await deleteNovel(novel.id);

    expect(result.success).toBe(true);

    // Verify reading history is deleted
    const readingHistory = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.novel_id, novel.id))
      .execute();

    expect(readingHistory).toHaveLength(0);
  });

  it('should return false when novel does not exist', async () => {
    const result = await deleteNovel(999);

    expect(result.success).toBe(false);
  });

  it('should handle complete cascade deletion', async () => {
    // Set up complete test data with all relationships
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    const [author] = await db.insert(authorsTable)
      .values({ name: 'Test Author' })
      .returning()
      .execute();

    const [genre] = await db.insert(genresTable)
      .values({ name: 'Fantasy' })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const [chapter] = await db.insert(chaptersTable)
      .values({
        novel_id: novel.id,
        title: 'Chapter 1',
        content: 'Content 1',
        chapter_number: 1
      })
      .returning()
      .execute();

    await db.insert(novelGenresTable)
      .values({
        novel_id: novel.id,
        genre_id: genre.id
      })
      .execute();

    await db.insert(readingHistoryTable)
      .values({
        user_id: user.id,
        novel_id: novel.id,
        chapter_id: chapter.id,
        progress_percentage: '75.50'
      })
      .execute();

    // Delete the novel
    const result = await deleteNovel(novel.id);

    expect(result.success).toBe(true);

    // Verify all related data is deleted
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novel.id))
      .execute();

    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.novel_id, novel.id))
      .execute();

    const novelGenres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, novel.id))
      .execute();

    const readingHistory = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.novel_id, novel.id))
      .execute();

    expect(novels).toHaveLength(0);
    expect(chapters).toHaveLength(0);
    expect(novelGenres).toHaveLength(0);
    expect(readingHistory).toHaveLength(0);

    // Verify unrelated data remains
    const remainingAuthors = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, author.id))
      .execute();

    const remainingGenres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, genre.id))
      .execute();

    expect(remainingAuthors).toHaveLength(1);
    expect(remainingGenres).toHaveLength(1);
  });
});
