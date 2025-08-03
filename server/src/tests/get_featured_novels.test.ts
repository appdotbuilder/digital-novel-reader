
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable } from '../db/schema';
import { type CreateAuthorInput, type CreateNovelInput } from '../schema';
import { getFeaturedNovels } from '../handlers/get_featured_novels';

const testAuthor: CreateAuthorInput = {
  name: 'Test Author',
  bio: 'A test author',
  image_url: null
};

const testNovelFeatured: CreateNovelInput = {
  title: 'Featured Novel',
  description: 'A featured novel for testing',
  author_id: 1, // Will be set after author creation
  cover_image_url: null,
  status: 'ongoing',
  is_featured: true
};

const testNovelNotFeatured: CreateNovelInput = {
  title: 'Regular Novel',
  description: 'A regular novel for testing',
  author_id: 1, // Will be set after author creation
  cover_image_url: null,
  status: 'ongoing',
  is_featured: false
};

describe('getFeaturedNovels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no featured novels exist', async () => {
    const result = await getFeaturedNovels();
    expect(result).toEqual([]);
  });

  it('should return only featured novels', async () => {
    // Create author first
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const authorId = authorResult[0].id;

    // Create featured novel
    await db.insert(novelsTable)
      .values({
        title: testNovelFeatured.title,
        description: testNovelFeatured.description,
        author_id: authorId,
        cover_image_url: testNovelFeatured.cover_image_url,
        status: testNovelFeatured.status,
        is_featured: true
      })
      .execute();

    // Create non-featured novel
    await db.insert(novelsTable)
      .values({
        title: testNovelNotFeatured.title,
        description: testNovelNotFeatured.description,
        author_id: authorId,
        cover_image_url: testNovelNotFeatured.cover_image_url,
        status: testNovelNotFeatured.status,
        is_featured: false
      })
      .execute();

    const result = await getFeaturedNovels();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Featured Novel');
    expect(result[0].is_featured).toBe(true);
    expect(result[0].author_id).toEqual(authorId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple featured novels', async () => {
    // Create author first
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const authorId = authorResult[0].id;

    // Create two featured novels
    await db.insert(novelsTable)
      .values([
        {
          title: 'Featured Novel 1',
          description: 'First featured novel',
          author_id: authorId,
          status: 'ongoing',
          is_featured: true
        },
        {
          title: 'Featured Novel 2',
          description: 'Second featured novel',
          author_id: authorId,
          status: 'completed',
          is_featured: true
        }
      ])
      .execute();

    const result = await getFeaturedNovels();

    expect(result).toHaveLength(2);
    expect(result.every(novel => novel.is_featured)).toBe(true);
    expect(result.map(novel => novel.title)).toContain('Featured Novel 1');
    expect(result.map(novel => novel.title)).toContain('Featured Novel 2');
  });

  it('should include all novel fields', async () => {
    // Create author first
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const authorId = authorResult[0].id;

    // Create featured novel with all fields
    await db.insert(novelsTable)
      .values({
        title: 'Complete Novel',
        description: 'A novel with all fields',
        author_id: authorId,
        cover_image_url: 'https://example.com/cover.jpg',
        status: 'completed',
        is_featured: true,
        total_chapters: 50,
        total_views: 1000
      })
      .execute();

    const result = await getFeaturedNovels();

    expect(result).toHaveLength(1);
    const novel = result[0];
    expect(novel.title).toEqual('Complete Novel');
    expect(novel.description).toEqual('A novel with all fields');
    expect(novel.author_id).toEqual(authorId);
    expect(novel.cover_image_url).toEqual('https://example.com/cover.jpg');
    expect(novel.status).toEqual('completed');
    expect(novel.is_featured).toBe(true);
    expect(novel.total_chapters).toEqual(50);
    expect(novel.total_views).toEqual(1000);
    expect(novel.id).toBeDefined();
    expect(novel.created_at).toBeInstanceOf(Date);
    expect(novel.updated_at).toBeInstanceOf(Date);
  });
});
