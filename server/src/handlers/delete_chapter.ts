
import { db } from '../db';
import { chaptersTable, novelsTable, readingHistoryTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteChapter(id: number): Promise<{ success: boolean }> {
  try {
    // First check if chapter exists and get novel_id
    const chapter = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, id))
      .execute();

    if (chapter.length === 0) {
      throw new Error('Chapter not found');
    }

    const novelId = chapter[0].novel_id;

    // Delete related reading history records first
    await db.delete(readingHistoryTable)
      .where(eq(readingHistoryTable.chapter_id, id))
      .execute();

    // Delete the chapter
    await db.delete(chaptersTable)
      .where(eq(chaptersTable.id, id))
      .execute();

    // Update novel's total_chapters count
    const remainingChapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.novel_id, novelId))
      .execute();

    await db.update(novelsTable)
      .set({ 
        total_chapters: remainingChapters.length,
        updated_at: new Date()
      })
      .where(eq(novelsTable.id, novelId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Chapter deletion failed:', error);
    throw error;
  }
}
