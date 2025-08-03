
import { db } from '../db';
import { chaptersTable, novelsTable } from '../db/schema';
import { type Chapter } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function getChapterById(id: number): Promise<Chapter | null> {
  try {
    // First, get the chapter
    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, id))
      .execute();

    if (chapters.length === 0) {
      return null;
    }

    const chapter = chapters[0];

    // Increment the novel's total_views using SQL fragment
    await db.update(novelsTable)
      .set({
        total_views: sql`${novelsTable.total_views} + 1`,
        updated_at: new Date()
      })
      .where(eq(novelsTable.id, chapter.novel_id))
      .execute();

    return chapter;
  } catch (error) {
    console.error('Failed to get chapter by id:', error);
    throw error;
  }
}
