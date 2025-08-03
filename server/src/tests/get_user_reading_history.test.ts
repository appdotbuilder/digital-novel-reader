
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, authorsTable, novelsTable, chaptersTable, readingHistoryTable } from '../db/schema';
import { type GetUserReadingHistoryInput } from '../schema';
import { getUserReadingHistory } from '../handlers/get_user_reading_history';

describe('getUserReadingHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch user reading history with proper numeric conversion', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        username: 'reader',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test author
    const [author] = await db.insert(authorsTable)
      .values({
        name: 'Test Author'
      })
      .returning()
      .execute();

    // Create test novel
    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Create test chapter
    const [chapter] = await db.insert(chaptersTable)
      .values({
        novel_id: novel.id,
        title: 'Chapter 1',
        content: 'Test chapter content',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    // Create reading history entry
    await db.insert(readingHistoryTable)
      .values({
        user_id: user.id,
        novel_id: novel.id,
        chapter_id: chapter.id,
        progress_percentage: '75.50' // Insert as string (numeric column)
      })
      .execute();

    const input: GetUserReadingHistoryInput = {
      user_id: user.id
    };

    const result = await getUserReadingHistory(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].novel_id).toEqual(novel.id);
    expect(result[0].chapter_id).toEqual(chapter.id);
    expect(result[0].progress_percentage).toEqual(75.5);
    expect(typeof result[0].progress_percentage).toBe('number');
    expect(result[0].last_read_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return empty array for user with no reading history', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'newuser@test.com',
        username: 'newuser',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const input: GetUserReadingHistoryInput = {
      user_id: user.id
    };

    const result = await getUserReadingHistory(input);

    expect(result).toHaveLength(0);
  });

  it('should apply limit when specified', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        username: 'reader',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test author
    const [author] = await db.insert(authorsTable)
      .values({
        name: 'Test Author'
      })
      .returning()
      .execute();

    // Create test novel
    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: author.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Create multiple chapters and reading history entries
    for (let i = 1; i <= 3; i++) {
      const [chapter] = await db.insert(chaptersTable)
        .values({
          novel_id: novel.id,
          title: `Chapter ${i}`,
          content: `Test chapter ${i} content`,
          chapter_number: i,
          is_published: true
        })
        .returning()
        .execute();

      await db.insert(readingHistoryTable)
        .values({
          user_id: user.id,
          novel_id: novel.id,
          chapter_id: chapter.id,
          progress_percentage: `${i * 25}.00`
        })
        .execute();
    }

    const input: GetUserReadingHistoryInput = {
      user_id: user.id,
      limit: 2
    };

    const result = await getUserReadingHistory(input);

    expect(result).toHaveLength(2);
    // Results should be ordered by last_read_at descending
    expect(result[0].progress_percentage).toEqual(75);
    expect(result[1].progress_percentage).toEqual(50);
  });

  it('should handle multiple reading history entries correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        username: 'reader',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test author
    const [author] = await db.insert(authorsTable)
      .values({
        name: 'Test Author'
      })
      .returning()
      .execute();

    // Create two novels
    const [novel1] = await db.insert(novelsTable)
      .values({
        title: 'Novel 1',
        description: 'First novel',
        author_id: author.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const [novel2] = await db.insert(novelsTable)
      .values({
        title: 'Novel 2',
        description: 'Second novel',
        author_id: author.id,
        status: 'completed'
      })
      .returning()
      .execute();

    // Create chapters for each novel
    const [chapter1] = await db.insert(chaptersTable)
      .values({
        novel_id: novel1.id,
        title: 'Chapter 1',
        content: 'Content 1',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    const [chapter2] = await db.insert(chaptersTable)
      .values({
        novel_id: novel2.id,
        title: 'Chapter 1',
        content: 'Content 2',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    // Create reading history for both novels
    await db.insert(readingHistoryTable)
      .values([
        {
          user_id: user.id,
          novel_id: novel1.id,
          chapter_id: chapter1.id,
          progress_percentage: '50.25'
        },
        {
          user_id: user.id,
          novel_id: novel2.id,
          chapter_id: chapter2.id,
          progress_percentage: '100.00'
        }
      ])
      .execute();

    const input: GetUserReadingHistoryInput = {
      user_id: user.id
    };

    const result = await getUserReadingHistory(input);

    expect(result).toHaveLength(2);
    
    // Verify both entries have proper numeric conversion
    result.forEach(entry => {
      expect(typeof entry.progress_percentage).toBe('number');
      expect(entry.user_id).toEqual(user.id);
      expect(entry.last_read_at).toBeInstanceOf(Date);
    });

    // Check specific values
    const novel1Entry = result.find(entry => entry.novel_id === novel1.id);
    const novel2Entry = result.find(entry => entry.novel_id === novel2.id);
    
    expect(novel1Entry?.progress_percentage).toEqual(50.25);
    expect(novel2Entry?.progress_percentage).toEqual(100);
  });
});
