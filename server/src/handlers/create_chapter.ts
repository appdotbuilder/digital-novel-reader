
import { db } from '../db';
import { chaptersTable, novelsTable } from '../db/schema';
import { type CreateChapterInput, type Chapter } from '../schema';
import { eq } from 'drizzle-orm';

export const createChapter = async (input: CreateChapterInput): Promise<Chapter> => {
  try {
    // First verify the novel exists
    const novel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, input.novel_id))
      .execute();

    if (novel.length === 0) {
      throw new Error(`Novel with id ${input.novel_id} not found`);
    }

    // Insert chapter record
    const result = await db.insert(chaptersTable)
      .values({
        novel_id: input.novel_id,
        title: input.title,
        content: input.content,
        chapter_number: input.chapter_number,
        is_published: input.is_published ?? false
      })
      .returning()
      .execute();

    const chapter = result[0];

    // If the chapter is published, update the novel's total_chapters count
    if (chapter.is_published) {
      // Get current count of published chapters for this novel
      const publishedChapters = await db.select()
        .from(chaptersTable)
        .where(eq(chaptersTable.novel_id, input.novel_id))
        .execute();

      const publishedCount = publishedChapters.filter(ch => ch.is_published).length;

      // Update novel's total_chapters count
      await db.update(novelsTable)
        .set({ 
          total_chapters: publishedCount,
          updated_at: new Date()
        })
        .where(eq(novelsTable.id, input.novel_id))
        .execute();
    }

    return chapter;
  } catch (error) {
    console.error('Chapter creation failed:', error);
    throw error;
  }
};
