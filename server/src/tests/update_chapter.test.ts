
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable, chaptersTable } from '../db/schema';
import { type UpdateChapterInput } from '../schema';
import { updateChapter } from '../handlers/update_chapter';
import { eq } from 'drizzle-orm';

describe('updateChapter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let authorId: number;
  let novelId: number;
  let chapterId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const author = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Test bio',
        image_url: null
      })
      .returning()
      .execute();
    authorId = author[0].id;

    const novel = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'Test description',
        author_id: authorId,
        cover_image_url: null,
        status: 'ongoing',
        is_featured: false,
        total_chapters: 1,
        total_views: 0
      })
      .returning()
      .execute();
    novelId = novel[0].id;

    const chapter = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        title: 'Original Chapter',
        content: 'Original content',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();
    chapterId = chapter[0].id;
  });

  it('should update chapter fields', async () => {
    const updateInput: UpdateChapterInput = {
      id: chapterId,
      title: 'Updated Chapter Title',
      content: 'Updated chapter content',
      chapter_number: 2,
      is_published: false
    };

    const result = await updateChapter(updateInput);

    expect(result.id).toEqual(chapterId);
    expect(result.title).toEqual('Updated Chapter Title');
    expect(result.content).toEqual('Updated chapter content');
    expect(result.chapter_number).toEqual(2);
    expect(result.is_published).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update chapter in database', async () => {
    const updateInput: UpdateChapterInput = {
      id: chapterId,
      title: 'Updated Title',
      content: 'Updated content'
    };

    await updateChapter(updateInput);

    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, chapterId))
      .execute();

    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toEqual('Updated Title');
    expect(chapters[0].content).toEqual('Updated content');
    expect(chapters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update novel total_chapters when publishing status changes', async () => {
    // Start with published chapter, unpublish it
    const updateInput: UpdateChapterInput = {
      id: chapterId,
      is_published: false
    };

    await updateChapter(updateInput);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelId))
      .execute();

    expect(novels[0].total_chapters).toEqual(0);
  });

  it('should increase total_chapters when publishing unpublished chapter', async () => {
    // First unpublish the chapter
    await db.update(chaptersTable)
      .set({ is_published: false })
      .where(eq(chaptersTable.id, chapterId))
      .execute();

    await db.update(novelsTable)
      .set({ total_chapters: 0 })
      .where(eq(novelsTable.id, novelId))
      .execute();

    // Now publish it through updateChapter
    const updateInput: UpdateChapterInput = {
      id: chapterId,
      is_published: true
    };

    await updateChapter(updateInput);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelId))
      .execute();

    expect(novels[0].total_chapters).toEqual(1);
  });

  it('should not change total_chapters when publishing status unchanged', async () => {
    // Update other fields but keep same publishing status
    const updateInput: UpdateChapterInput = {
      id: chapterId,
      title: 'New Title',
      is_published: true // Same as original
    };

    await updateChapter(updateInput);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelId))
      .execute();

    expect(novels[0].total_chapters).toEqual(1); // Should remain the same
  });

  it('should handle partial updates correctly', async () => {
    const updateInput: UpdateChapterInput = {
      id: chapterId,
      title: 'Only Title Updated'
    };

    const result = await updateChapter(updateInput);

    expect(result.title).toEqual('Only Title Updated');
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.chapter_number).toEqual(1); // Should remain unchanged
    expect(result.is_published).toEqual(true); // Should remain unchanged
  });

  it('should throw error for non-existent chapter', async () => {
    const updateInput: UpdateChapterInput = {
      id: 99999,
      title: 'This should fail'
    };

    expect(updateChapter(updateInput)).rejects.toThrow(/chapter not found/i);
  });
});
