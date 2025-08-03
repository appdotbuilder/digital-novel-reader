
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chaptersTable, novelsTable, authorsTable } from '../db/schema';
import { type CreateChapterInput } from '../schema';
import { createChapter } from '../handlers/create_chapter';
import { eq } from 'drizzle-orm';

describe('createChapter', () => {
  let authorId: number;
  let novelId: number;

  beforeEach(async () => {
    await createDB();

    // Create prerequisite author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'A test author',
        image_url: null
      })
      .returning()
      .execute();
    authorId = authorResult[0].id;

    // Create prerequisite novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'A test novel',
        author_id: authorId,
        cover_image_url: null,
        status: 'draft',
        is_featured: false,
        total_chapters: 0,
        total_views: 0
      })
      .returning()
      .execute();
    novelId = novelResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateChapterInput = {
    novel_id: 0, // Will be set in tests
    title: 'Test Chapter',
    content: 'This is the content of the test chapter.',
    chapter_number: 1,
    is_published: true
  };

  it('should create a chapter', async () => {
    const input = { ...testInput, novel_id: novelId };
    const result = await createChapter(input);

    expect(result.novel_id).toEqual(novelId);
    expect(result.title).toEqual('Test Chapter');
    expect(result.content).toEqual(testInput.content);
    expect(result.chapter_number).toEqual(1);
    expect(result.is_published).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save chapter to database', async () => {
    const input = { ...testInput, novel_id: novelId };
    const result = await createChapter(input);

    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, result.id))
      .execute();

    expect(chapters).toHaveLength(1);
    expect(chapters[0].novel_id).toEqual(novelId);
    expect(chapters[0].title).toEqual('Test Chapter');
    expect(chapters[0].content).toEqual(testInput.content);
    expect(chapters[0].chapter_number).toEqual(1);
    expect(chapters[0].is_published).toEqual(true);
  });

  it('should update novel total_chapters count when chapter is published', async () => {
    const input = { ...testInput, novel_id: novelId, is_published: true };
    await createChapter(input);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelId))
      .execute();

    expect(novels[0].total_chapters).toEqual(1);
  });

  it('should not update novel total_chapters count when chapter is unpublished', async () => {
    const input = { ...testInput, novel_id: novelId, is_published: false };
    await createChapter(input);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelId))
      .execute();

    expect(novels[0].total_chapters).toEqual(0);
  });

  it('should correctly count multiple published chapters', async () => {
    // Create first published chapter
    const input1 = { ...testInput, novel_id: novelId, chapter_number: 1, is_published: true };
    await createChapter(input1);

    // Create second published chapter
    const input2 = { ...testInput, novel_id: novelId, chapter_number: 2, is_published: true };
    await createChapter(input2);

    // Create unpublished chapter
    const input3 = { ...testInput, novel_id: novelId, chapter_number: 3, is_published: false };
    await createChapter(input3);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelId))
      .execute();

    expect(novels[0].total_chapters).toEqual(2);
  });

  it('should default is_published to false when not provided', async () => {
    const input = {
      novel_id: novelId,
      title: 'Test Chapter',
      content: 'Test content',
      chapter_number: 1
    };
    const result = await createChapter(input);

    expect(result.is_published).toEqual(false);
  });

  it('should throw error when novel does not exist', async () => {
    const input = { ...testInput, novel_id: 99999 };

    expect(createChapter(input)).rejects.toThrow(/Novel with id 99999 not found/i);
  });
});
