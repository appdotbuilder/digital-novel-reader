
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable, chaptersTable } from '../db/schema';
import { type GetChaptersInput, type CreateAuthorInput, type CreateNovelInput, type CreateChapterInput } from '../schema';
import { getChapters } from '../handlers/get_chapters';

// Test data
const testAuthor: CreateAuthorInput = {
  name: 'Test Author',
  bio: 'Author bio',
  image_url: null
};

const testNovel: CreateNovelInput = {
  title: 'Test Novel',
  description: 'A novel for testing',
  author_id: 1, // Will be set after author creation
  status: 'ongoing',
  is_featured: false
};

const testChapter1: CreateChapterInput = {
  novel_id: 1, // Will be set after novel creation
  title: 'Chapter 1',
  content: 'Content of chapter 1',
  chapter_number: 1,
  is_published: true
};

const testChapter2: CreateChapterInput = {
  novel_id: 1, // Will be set after novel creation
  title: 'Chapter 2',
  content: 'Content of chapter 2',
  chapter_number: 2,
  is_published: false
};

const testChapter3: CreateChapterInput = {
  novel_id: 1, // Will be set after novel creation
  title: 'Chapter 3',
  content: 'Content of chapter 3',
  chapter_number: 3,
  is_published: true
};

describe('getChapters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all chapters for a novel', async () => {
    // Create author
    const [author] = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    // Create novel
    const [novel] = await db.insert(novelsTable)
      .values({
        title: testNovel.title,
        description: testNovel.description,
        author_id: author.id,
        status: testNovel.status,
        is_featured: testNovel.is_featured
      })
      .returning()
      .execute();

    // Create chapters
    await db.insert(chaptersTable)
      .values([
        {
          novel_id: novel.id,
          title: testChapter1.title,
          content: testChapter1.content,
          chapter_number: testChapter1.chapter_number,
          is_published: testChapter1.is_published
        },
        {
          novel_id: novel.id,
          title: testChapter2.title,
          content: testChapter2.content,
          chapter_number: testChapter2.chapter_number,
          is_published: testChapter2.is_published
        },
        {
          novel_id: novel.id,
          title: testChapter3.title,
          content: testChapter3.content,
          chapter_number: testChapter3.chapter_number,
          is_published: testChapter3.is_published
        }
      ])
      .execute();

    const input: GetChaptersInput = {
      novel_id: novel.id
    };

    const result = await getChapters(input);

    expect(result).toHaveLength(3);
    
    // Check ordering by chapter number
    expect(result[0].chapter_number).toBe(1);
    expect(result[1].chapter_number).toBe(2);
    expect(result[2].chapter_number).toBe(3);
    
    // Check all fields are present
    expect(result[0].title).toBe('Chapter 1');
    expect(result[0].content).toBe('Content of chapter 1');
    expect(result[0].is_published).toBe(true);
    expect(result[0].novel_id).toBe(novel.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter published chapters only when requested', async () => {
    // Create author
    const [author] = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    // Create novel
    const [novel] = await db.insert(novelsTable)
      .values({
        title: testNovel.title,
        description: testNovel.description,
        author_id: author.id,
        status: testNovel.status,
        is_featured: testNovel.is_featured
      })
      .returning()
      .execute();

    // Create chapters (1 and 3 published, 2 unpublished)
    await db.insert(chaptersTable)
      .values([
        {
          novel_id: novel.id,
          title: testChapter1.title,
          content: testChapter1.content,
          chapter_number: testChapter1.chapter_number,
          is_published: testChapter1.is_published
        },
        {
          novel_id: novel.id,
          title: testChapter2.title,
          content: testChapter2.content,
          chapter_number: testChapter2.chapter_number,
          is_published: testChapter2.is_published
        },
        {
          novel_id: novel.id,
          title: testChapter3.title,
          content: testChapter3.content,
          chapter_number: testChapter3.chapter_number,
          is_published: testChapter3.is_published
        }
      ])
      .execute();

    const input: GetChaptersInput = {
      novel_id: novel.id,
      published_only: true
    };

    const result = await getChapters(input);

    expect(result).toHaveLength(2);
    expect(result[0].chapter_number).toBe(1);
    expect(result[0].is_published).toBe(true);
    expect(result[1].chapter_number).toBe(3);
    expect(result[1].is_published).toBe(true);
  });

  it('should return empty array for non-existent novel', async () => {
    const input: GetChaptersInput = {
      novel_id: 999
    };

    const result = await getChapters(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no published chapters exist', async () => {
    // Create author
    const [author] = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    // Create novel
    const [novel] = await db.insert(novelsTable)
      .values({
        title: testNovel.title,
        description: testNovel.description,
        author_id: author.id,
        status: testNovel.status,
        is_featured: testNovel.is_featured
      })
      .returning()
      .execute();

    // Create only unpublished chapter
    await db.insert(chaptersTable)
      .values({
        novel_id: novel.id,
        title: testChapter2.title,
        content: testChapter2.content,
        chapter_number: testChapter2.chapter_number,
        is_published: false
      })
      .execute();

    const input: GetChaptersInput = {
      novel_id: novel.id,
      published_only: true
    };

    const result = await getChapters(input);

    expect(result).toHaveLength(0);
  });
});
