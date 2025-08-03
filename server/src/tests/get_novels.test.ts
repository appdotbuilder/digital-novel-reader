
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable } from '../db/schema';
import { getNovelsList } from '../handlers/get_novels';
import { type CreateAuthorInput, type CreateNovelInput } from '../schema';

// Test data
const testAuthor: CreateAuthorInput = {
  name: 'Test Author',
  bio: 'A test author',
  image_url: null
};

const testNovel: CreateNovelInput = {
  title: 'Test Novel',
  description: 'A novel for testing',
  author_id: 1, // Will be set after creating author
  cover_image_url: null,
  status: 'ongoing',
  is_featured: false
};

describe('getNovelsList', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no novels exist', async () => {
    const result = await getNovelsList();
    expect(result).toEqual([]);
  });

  it('should return all novels with complete data', async () => {
    // Create author first
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const author = authorResult[0];

    // Create novel
    await db.insert(novelsTable)
      .values({
        title: testNovel.title,
        description: testNovel.description,
        author_id: author.id,
        cover_image_url: testNovel.cover_image_url,
        status: testNovel.status,
        is_featured: testNovel.is_featured
      })
      .execute();

    const result = await getNovelsList();

    expect(result).toHaveLength(1);
    const novel = result[0];
    
    expect(novel.title).toEqual('Test Novel');
    expect(novel.description).toEqual('A novel for testing');
    expect(novel.author_id).toEqual(author.id);
    expect(novel.status).toEqual('ongoing');
    expect(novel.is_featured).toEqual(false);
    expect(novel.total_chapters).toEqual(0);
    expect(novel.total_views).toEqual(0);
    expect(novel.id).toBeDefined();
    expect(novel.created_at).toBeInstanceOf(Date);
    expect(novel.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple novels when they exist', async () => {
    // Create author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const author = authorResult[0];

    // Create multiple novels
    await db.insert(novelsTable)
      .values([
        {
          title: 'First Novel',
          description: 'First test novel',
          author_id: author.id,
          status: 'ongoing',
          is_featured: true
        },
        {
          title: 'Second Novel',
          description: 'Second test novel',
          author_id: author.id,
          status: 'completed',
          is_featured: false
        }
      ])
      .execute();

    const result = await getNovelsList();

    expect(result).toHaveLength(2);
    
    const titles = result.map(novel => novel.title);
    expect(titles).toContain('First Novel');
    expect(titles).toContain('Second Novel');
    
    // Verify all novels have required fields
    result.forEach(novel => {
      expect(novel.id).toBeDefined();
      expect(novel.author_id).toEqual(author.id);
      expect(novel.created_at).toBeInstanceOf(Date);
      expect(novel.updated_at).toBeInstanceOf(Date);
      expect(typeof novel.total_chapters).toBe('number');
      expect(typeof novel.total_views).toBe('number');
    });
  });

  it('should handle novels with different statuses', async () => {
    // Create author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const author = authorResult[0];

    // Create novels with different statuses
    await db.insert(novelsTable)
      .values([
        {
          title: 'Ongoing Novel',
          description: 'An ongoing novel',
          author_id: author.id,
          status: 'ongoing'
        },
        {
          title: 'Completed Novel',
          description: 'A completed novel',
          author_id: author.id,
          status: 'completed'
        },
        {
          title: 'Draft Novel',
          description: 'A draft novel',
          author_id: author.id,
          status: 'draft'
        },
        {
          title: 'Hiatus Novel',
          description: 'A novel on hiatus',
          author_id: author.id,
          status: 'hiatus'
        }
      ])
      .execute();

    const result = await getNovelsList();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(novel => novel.status);
    expect(statuses).toContain('ongoing');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('draft');
    expect(statuses).toContain('hiatus');
  });
});
