
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable, chaptersTable } from '../db/schema';
import { getChapterById } from '../handlers/get_chapter_by_id';
import { eq } from 'drizzle-orm';

describe('getChapterById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a chapter by id', async () => {
    // Create test data
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Author bio',
        image_url: null
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'Novel description',
        author_id: authorResult[0].id,
        cover_image_url: null,
        status: 'ongoing',
        is_featured: false,
        total_chapters: 1,
        total_views: 0
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Chapter 1',
        content: 'Chapter content goes here',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    const result = await getChapterById(chapterResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(chapterResult[0].id);
    expect(result!.title).toEqual('Chapter 1');
    expect(result!.content).toEqual('Chapter content goes here');
    expect(result!.chapter_number).toEqual(1);
    expect(result!.novel_id).toEqual(novelResult[0].id);
    expect(result!.is_published).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when chapter does not exist', async () => {
    const result = await getChapterById(999);
    expect(result).toBeNull();
  });

  it('should increment novel total_views when chapter is accessed', async () => {
    // Create test data
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Author bio',
        image_url: null
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'Novel description',
        author_id: authorResult[0].id,
        cover_image_url: null,
        status: 'ongoing',
        is_featured: false,
        total_chapters: 1,
        total_views: 5 // Starting with 5 views
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Chapter 1',
        content: 'Chapter content goes here',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    // Get the chapter (should increment views)
    await getChapterById(chapterResult[0].id);

    // Check that novel's total_views was incremented
    const updatedNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelResult[0].id))
      .execute();

    expect(updatedNovel[0].total_views).toEqual(6); // Should be incremented from 5 to 6
  });

  it('should increment views multiple times for multiple accesses', async () => {
    // Create test data
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Author bio',
        image_url: null
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'Novel description',
        author_id: authorResult[0].id,
        cover_image_url: null,
        status: 'ongoing',
        is_featured: false,
        total_chapters: 1,
        total_views: 0
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Chapter 1',
        content: 'Chapter content goes here',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    // Access the chapter multiple times
    await getChapterById(chapterResult[0].id);
    await getChapterById(chapterResult[0].id);
    await getChapterById(chapterResult[0].id);

    // Check that novel's total_views was incremented correctly
    const updatedNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelResult[0].id))
      .execute();

    expect(updatedNovel[0].total_views).toEqual(3); // Should be incremented 3 times
  });

  it('should update novel updated_at timestamp when incrementing views', async () => {
    // Create test data
    const authorResult = await db.insert(authorsTable)
      .values({
        name: 'Test Author',
        bio: 'Author bio',
        image_url: null
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        description: 'Novel description',
        author_id: authorResult[0].id,
        cover_image_url: null,
        status: 'ongoing',
        is_featured: false,
        total_chapters: 1,
        total_views: 0
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        title: 'Chapter 1',
        content: 'Chapter content goes here',
        chapter_number: 1,
        is_published: true
      })
      .returning()
      .execute();

    const originalUpdatedAt = novelResult[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Access the chapter
    await getChapterById(chapterResult[0].id);

    // Check that novel's updated_at was changed
    const updatedNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelResult[0].id))
      .execute();

    expect(updatedNovel[0].updated_at).not.toEqual(originalUpdatedAt);
    expect(updatedNovel[0].updated_at).toBeInstanceOf(Date);
  });
});
