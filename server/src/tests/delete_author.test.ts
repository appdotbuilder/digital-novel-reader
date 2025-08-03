
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable, novelsTable } from '../db/schema';
import { type CreateAuthorInput, type CreateNovelInput } from '../schema';
import { deleteAuthor } from '../handlers/delete_author';
import { eq } from 'drizzle-orm';

// Test data
const testAuthor: CreateAuthorInput = {
  name: 'Test Author',
  bio: 'A test author',
  image_url: 'http://example.com/author.jpg'
};

const testNovel: CreateNovelInput = {
  title: 'Test Novel',
  description: 'A test novel',
  author_id: 1, // Will be updated after creating author
  status: 'draft',
  is_featured: false
};

describe('deleteAuthor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an author successfully', async () => {
    // Create test author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const authorId = authorResult[0].id;

    // Delete the author
    const result = await deleteAuthor(authorId);

    expect(result.success).toBe(true);

    // Verify author is deleted from database
    const authors = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, authorId))
      .execute();

    expect(authors).toHaveLength(0);
  });

  it('should throw error if author does not exist', async () => {
    await expect(deleteAuthor(999)).rejects.toThrow(/author not found/i);
  });

  it('should prevent deletion if author has novels', async () => {
    // Create test author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const authorId = authorResult[0].id;

    // Create a novel for this author
    await db.insert(novelsTable)
      .values({
        title: testNovel.title,
        description: testNovel.description,
        author_id: authorId,
        status: testNovel.status,
        is_featured: testNovel.is_featured || false,
        total_chapters: 0,
        total_views: 0
      })
      .execute();

    // Attempt to delete author should fail
    await expect(deleteAuthor(authorId)).rejects.toThrow(/cannot delete author with existing novels/i);

    // Verify author still exists
    const authors = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, authorId))
      .execute();

    expect(authors).toHaveLength(1);
  });

  it('should handle multiple novels preventing deletion', async () => {
    // Create test author
    const authorResult = await db.insert(authorsTable)
      .values({
        name: testAuthor.name,
        bio: testAuthor.bio,
        image_url: testAuthor.image_url
      })
      .returning()
      .execute();

    const authorId = authorResult[0].id;

    // Create multiple novels for this author
    await db.insert(novelsTable)
      .values([
        {
          title: 'Novel 1',
          description: 'First novel',
          author_id: authorId,
          status: 'draft',
          is_featured: false,
          total_chapters: 0,
          total_views: 0
        },
        {
          title: 'Novel 2',
          description: 'Second novel',
          author_id: authorId,
          status: 'ongoing',
          is_featured: true,
          total_chapters: 5,
          total_views: 100
        }
      ])
      .execute();

    // Attempt to delete author should fail
    await expect(deleteAuthor(authorId)).rejects.toThrow(/cannot delete author with existing novels/i);

    // Verify author still exists
    const authors = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, authorId))
      .execute();

    expect(authors).toHaveLength(1);
  });
});
