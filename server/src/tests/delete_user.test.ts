
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readingHistoryTable, authorsTable, novelsTable, chaptersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteUser } from '../handlers/delete_user';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a user successfully', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password_123',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Delete the user
    const result = await deleteUser(userId);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(deletedUser).toHaveLength(0);
  });

  it('should delete user with reading history', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password_123',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create test author
    const authors = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Test author bio'
      })
      .returning()
      .execute();

    const authorId = authors[0].id;

    // Create test novel
    const novels = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'Test description',
        author_id: authorId,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const novelId = novels[0].id;

    // Create test chapter
    const chapters = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        title: 'Test Chapter',
        content: 'Test content',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    const chapterId = chapters[0].id;

    // Create reading history
    await db.insert(readingHistoryTable)
      .values({
        user_id: userId,
        novel_id: novelId,
        chapter_id: chapterId,
        progress_percentage: '50.00'
      })
      .execute();

    // Verify reading history exists
    const readingHistory = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.user_id, userId))
      .execute();

    expect(readingHistory).toHaveLength(1);

    // Delete the user
    const result = await deleteUser(userId);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(deletedUser).toHaveLength(0);

    // Verify reading history is also deleted
    const remainingReadingHistory = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.user_id, userId))
      .execute();

    expect(remainingReadingHistory).toHaveLength(0);
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentUserId = 999;

    await expect(deleteUser(nonExistentUserId)).rejects.toThrow(/user not found/i);
  });

  it('should handle user with no reading history', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password_123',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Verify no reading history exists
    const readingHistory = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.user_id, userId))
      .execute();

    expect(readingHistory).toHaveLength(0);

    // Delete the user
    const result = await deleteUser(userId);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(deletedUser).toHaveLength(0);
  });
});
