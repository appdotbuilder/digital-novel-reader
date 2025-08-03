
import { db } from '../db';
import { readingHistoryTable, novelsTable, chaptersTable } from '../db/schema';
import { type GetUserReadingHistoryInput, type ReadingHistory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserReadingHistory(input: GetUserReadingHistoryInput): Promise<ReadingHistory[]> {
  try {
    // Build base query with joins to get novel and chapter details
    let query = db.select({
      id: readingHistoryTable.id,
      user_id: readingHistoryTable.user_id,
      novel_id: readingHistoryTable.novel_id,
      chapter_id: readingHistoryTable.chapter_id,
      progress_percentage: readingHistoryTable.progress_percentage,
      last_read_at: readingHistoryTable.last_read_at
    })
      .from(readingHistoryTable)
      .innerJoin(novelsTable, eq(readingHistoryTable.novel_id, novelsTable.id))
      .innerJoin(chaptersTable, eq(readingHistoryTable.chapter_id, chaptersTable.id))
      .where(eq(readingHistoryTable.user_id, input.user_id))
      .orderBy(desc(readingHistoryTable.last_read_at));

    // Apply limit if specified
    const finalQuery = input.limit ? query.limit(input.limit) : query;

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result,
      progress_percentage: parseFloat(result.progress_percentage) // Convert string to number
    }));
  } catch (error) {
    console.error('Failed to fetch user reading history:', error);
    throw error;
  }
}
