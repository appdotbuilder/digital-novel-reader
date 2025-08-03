
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable, chaptersTable, usersTable, readingHistoryTable } from '../db/schema';
import { deleteChapter } from '../handlers/delete_chapter';
import { eq } from 'drizzle-orm';

describe('deleteChapter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a chapter successfully', async () => {
    // Create prerequisite data
    const authorResult = await db.insert(authorsTable)
      .values({ name: 'Test Author', bio: null, image_url: null })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: authorResult[0].id,
        status: 'draft',
        is_featured: false
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Test Chapter',
        content: 'Chapter content',
        chapter_number: 1,
        is_published: false
      })
      .returning()
      .execute();

    const result = await deleteChapter(chapterResult[0].id);

    expect(result.success).toBe(true);

    // Verify chapter is actually deleted
    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, chapterResult[0].id))
      .execute();

    expect(chapters).toHaveLength(0);
  });

  it('should update novel total_chapters count', async () => {
    // Create prerequisite data
    const authorResult = await db.insert(authorsTable)
      .values({ name: 'Test Author', bio: null, image_url: null })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: authorResult[0].id,
        status: 'draft',
        is_featured: false,
        total_chapters: 2
      })
      .returning()
      .execute();

    // Create two chapters
    const chapter1Result = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Chapter 1',
        content: 'Content 1',
        chapter_number: 1,
        is_published: false
      })
      .returning()
      .execute();

    await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Chapter 2',
        content: 'Content 2',
        chapter_number: 2,
        is_published: false
      })
      .returning()
      .execute();

    await deleteChapter(chapter1Result[0].id);

    // Check novel's total_chapters was updated
    const updatedNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelResult[0].id))
      .execute();

    expect(updatedNovel[0].total_chapters).toBe(1);
    expect(updatedNovel[0].updated_at).toBeInstanceOf(Date);
  });

  it('should clean up reading history records', async () => {
    // Create prerequisite data
    const authorResult = await db.insert(authorsTable)
      .values({ name: 'Test Author', bio: null, image_url: null })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash',
        is_admin: false
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: authorResult[0].id,
        status: 'draft',
        is_featured: false
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Test Chapter',
        content: 'Chapter content',
        chapter_number: 1,
        is_published: false
      })
      .returning()
      .execute();

    // Create reading history record
    await db.insert(readingHistoryTable)
      .values({
        user_id: userResult[0].id,
        novel_id: novelResult[0].id,
        chapter_id: chapterResult[0].id,
        progress_percentage: '75.50'
      })
      .execute();

    await deleteChapter(chapterResult[0].id);

    // Verify reading history was cleaned up
    const readingHistory = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.chapter_id, chapterResult[0].id))
      .execute();

    expect(readingHistory).toHaveLength(0);
  });

  it('should throw error for non-existent chapter', async () => {
    await expect(deleteChapter(999)).rejects.toThrow(/chapter not found/i);
  });
});
