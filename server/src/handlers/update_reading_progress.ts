
import { db } from '../db';
import { readingHistoryTable, usersTable, novelsTable, chaptersTable } from '../db/schema';
import { type UpdateReadingProgressInput, type ReadingHistory } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateReadingProgress(input: UpdateReadingProgressInput): Promise<ReadingHistory> {
  try {
    // Verify that user, novel, and chapter exist
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    const novel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, input.novel_id))
      .execute();

    if (novel.length === 0) {
      throw new Error(`Novel with id ${input.novel_id} not found`);
    }

    const chapter = await db.select()
      .from(chaptersTable)
      .where(and(
        eq(chaptersTable.id, input.chapter_id),
        eq(chaptersTable.novel_id, input.novel_id)
      ))
      .execute();

    if (chapter.length === 0) {
      throw new Error(`Chapter with id ${input.chapter_id} not found for novel ${input.novel_id}`);
    }

    // Check if reading history record already exists for this user and novel
    const existingHistory = await db.select()
      .from(readingHistoryTable)
      .where(and(
        eq(readingHistoryTable.user_id, input.user_id),
        eq(readingHistoryTable.novel_id, input.novel_id)
      ))
      .execute();

    let result: ReadingHistory;

    if (existingHistory.length > 0) {
      // Update existing record
      const updated = await db.update(readingHistoryTable)
        .set({
          chapter_id: input.chapter_id,
          progress_percentage: input.progress_percentage.toString(), // Convert number to string for numeric column
          last_read_at: new Date()
        })
        .where(eq(readingHistoryTable.id, existingHistory[0].id))
        .returning()
        .execute();

      result = {
        ...updated[0],
        progress_percentage: parseFloat(updated[0].progress_percentage) // Convert string back to number
      };
    } else {
      // Insert new record
      const inserted = await db.insert(readingHistoryTable)
        .values({
          user_id: input.user_id,
          novel_id: input.novel_id,
          chapter_id: input.chapter_id,
          progress_percentage: input.progress_percentage.toString(), // Convert number to string for numeric column
          last_read_at: new Date()
        })
        .returning()
        .execute();

      result = {
        ...inserted[0],
        progress_percentage: parseFloat(inserted[0].progress_percentage) // Convert string back to number
      };
    }

    return result;
  } catch (error) {
    console.error('Reading progress update failed:', error);
    throw error;
  }
}
