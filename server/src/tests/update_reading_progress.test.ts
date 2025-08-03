
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, authorsTable, novelsTable, chaptersTable, readingHistoryTable } from '../db/schema';
import { type UpdateReadingProgressInput } from '../schema';
import { updateReadingProgress } from '../handlers/update_reading_progress';
import { eq, and } from 'drizzle-orm';

describe('updateReadingProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testAuthorId: number;
  let testNovelId: number;
  let testChapterId: number;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password_123',
        is_admin: false
      })
      .returning()
      .execute();
    testUserId = user[0].id;

    // Create test author
    const author = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();
    testAuthorId = author[0].id;

    // Create test novel
    const novel = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: testAuthorId,
        status: 'ongoing',
        is_featured: false
      })
      .returning()
      .execute();
    testNovelId = novel[0].id;

    // Create test chapter
    const chapter = await db.insert(chaptersTable)
      .values({
        novel_id: testNovelId,
        title: 'Chapter 1',
        content: 'Test chapter content',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();
    testChapterId = chapter[0].id;
  });

  const testInput: UpdateReadingProgressInput = {
    user_id: 0, // Will be set in tests
    novel_id: 0, // Will be set in tests
    chapter_id: 0, // Will be set in tests
    progress_percentage: 75.5
  };

  it('should create new reading progress record', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: testNovelId,
      chapter_id: testChapterId
    };

    const result = await updateReadingProgress(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.novel_id).toEqual(testNovelId);
    expect(result.chapter_id).toEqual(testChapterId);
    expect(result.progress_percentage).toEqual(75.5);
    expect(typeof result.progress_percentage).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.last_read_at).toBeInstanceOf(Date);
  });

  it('should update existing reading progress record', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: testNovelId,
      chapter_id: testChapterId,
      progress_percentage: 50.0
    };

    // Create initial record
    const initial = await updateReadingProgress(input);

    // Update with new progress
    const updatedInput = {
      ...input,
      progress_percentage: 90.25
    };
    const updated = await updateReadingProgress(updatedInput);

    // Should have same ID (updated, not created new)
    expect(updated.id).toEqual(initial.id);
    expect(updated.progress_percentage).toEqual(90.25);
    expect(updated.last_read_at.getTime()).toBeGreaterThan(initial.last_read_at.getTime());
  });

  it('should save progress to database correctly', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: testNovelId,
      chapter_id: testChapterId
    };

    const result = await updateReadingProgress(input);

    // Verify in database
    const records = await db.select()
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].user_id).toEqual(testUserId);
    expect(records[0].novel_id).toEqual(testNovelId);
    expect(records[0].chapter_id).toEqual(testChapterId);
    expect(parseFloat(records[0].progress_percentage)).toEqual(75.5);
    expect(records[0].last_read_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...testInput,
      user_id: 999999,
      novel_id: testNovelId,
      chapter_id: testChapterId
    };

    expect(updateReadingProgress(input)).rejects.toThrow(/user with id 999999 not found/i);
  });

  it('should throw error for non-existent novel', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: 999999,
      chapter_id: testChapterId
    };

    expect(updateReadingProgress(input)).rejects.toThrow(/novel with id 999999 not found/i);
  });

  it('should throw error for non-existent chapter', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: testNovelId,
      chapter_id: 999999
    };

    expect(updateReadingProgress(input)).rejects.toThrow(/chapter with id 999999 not found/i);
  });

  it('should throw error for chapter not in specified novel', async () => {
    // Create another novel
    const anotherNovel = await db.insert(novelsTable)
      .values({
        title: 'Another Novel',
        description: 'Another test novel',
        author_id: testAuthorId,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Create chapter in the other novel
    const otherChapter = await db.insert(chaptersTable)
      .values({
        novel_id: anotherNovel[0].id,
        title: 'Other Chapter',
        content: 'Other chapter content',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: testNovelId, // Different novel
      chapter_id: otherChapter[0].id // Chapter from other novel
    };

    expect(updateReadingProgress(input)).rejects.toThrow(/chapter with id .* not found for novel/i);
  });

  it('should handle only one record per user-novel pair', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      novel_id: testNovelId,
      chapter_id: testChapterId
    };

    // Create first record
    await updateReadingProgress(input);

    // Update should not create duplicate
    await updateReadingProgress({
      ...input,
      progress_percentage: 80.0
    });

    // Verify only one record exists
    const records = await db.select()
      .from(readingHistoryTable)
      .where(and(
        eq(readingHistoryTable.user_id, testUserId),
        eq(readingHistoryTable.novel_id, testNovelId)
      ))
      .execute();

    expect(records).toHaveLength(1);
    expect(parseFloat(records[0].progress_percentage)).toEqual(80.0);
  });
});
