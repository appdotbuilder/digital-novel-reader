
import { db } from '../db';
import { novelsTable, chaptersTable, novelGenresTable, readingHistoryTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteNovel(id: number): Promise<{ success: boolean }> {
  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete reading history entries for this novel
    await db.delete(readingHistoryTable)
      .where(eq(readingHistoryTable.novel_id, id))
      .execute();

    // 2. Delete novel-genre associations
    await db.delete(novelGenresTable)
      .where(eq(novelGenresTable.novel_id, id))
      .execute();

    // 3. Delete chapters for this novel
    await db.delete(chaptersTable)
      .where(eq(chaptersTable.novel_id, id))
      .execute();

    // 4. Finally delete the novel itself
    const result = await db.delete(novelsTable)
      .where(eq(novelsTable.id, id))
      .returning()
      .execute();

    // Check if novel was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Novel deletion failed:', error);
    throw error;
  }
}
