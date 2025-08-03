
import { db } from '../db';
import { chaptersTable, novelsTable } from '../db/schema';
import { type UpdateChapterInput, type Chapter } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChapter = async (input: UpdateChapterInput): Promise<Chapter> => {
  try {
    // First, get the current chapter to check if is_published is changing
    const currentChapter = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, input.id))
      .execute();

    if (currentChapter.length === 0) {
      throw new Error('Chapter not found');
    }

    const wasPublished = currentChapter[0].is_published;
    const willBePublished = input.is_published !== undefined ? input.is_published : wasPublished;

    // Update the chapter
    const result = await db.update(chaptersTable)
      .set({
        title: input.title,
        content: input.content,
        chapter_number: input.chapter_number,
        is_published: input.is_published,
        updated_at: new Date()
      })
      .where(eq(chaptersTable.id, input.id))
      .returning()
      .execute();

    // If publishing status changed, update the novel's total_chapters count
    if (wasPublished !== willBePublished) {
      const novelId = currentChapter[0].novel_id;
      
      // Get current count of published chapters for this novel
      const publishedChapters = await db.select()
        .from(chaptersTable)
        .where(eq(chaptersTable.novel_id, novelId))
        .execute();

      const totalPublishedChapters = publishedChapters.filter(chapter => {
        // Apply the update to get accurate count
        if (chapter.id === input.id) {
          return willBePublished;
        }
        return chapter.is_published;
      }).length;

      // Update the novel's total_chapters count
      await db.update(novelsTable)
        .set({
          total_chapters: totalPublishedChapters,
          updated_at: new Date()
        })
        .where(eq(novelsTable.id, novelId))
        .execute();
    }

    return result[0];
  } catch (error) {
    console.error('Chapter update failed:', error);
    throw error;
  }
};
