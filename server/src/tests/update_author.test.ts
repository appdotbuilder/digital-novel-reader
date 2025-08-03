
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable } from '../db/schema';
import { type UpdateAuthorInput, type CreateAuthorInput } from '../schema';
import { updateAuthor } from '../handlers/update_author';
import { eq } from 'drizzle-orm';

// Helper to create a test author
const createTestAuthor = async (authorData: CreateAuthorInput) => {
  const result = await db.insert(authorsTable)
    .values({
      name: authorData.name,
      bio: authorData.bio || null,
      image_url: authorData.image_url || null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateAuthor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update author name', async () => {
    // Create test author
    const author = await createTestAuthor({
      name: 'Original Author',
      bio: 'Original bio',
      image_url: 'https://example.com/image.jpg'
    });

    const updateInput: UpdateAuthorInput = {
      id: author.id,
      name: 'Updated Author Name'
    };

    const result = await updateAuthor(updateInput);

    expect(result.id).toEqual(author.id);
    expect(result.name).toEqual('Updated Author Name');
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.image_url).toEqual('https://example.com/image.jpg'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(author.updated_at.getTime());
  });

  it('should update author bio', async () => {
    const author = await createTestAuthor({
      name: 'Test Author',
      bio: 'Original bio'
    });

    const updateInput: UpdateAuthorInput = {
      id: author.id,
      bio: 'Updated bio content'
    };

    const result = await updateAuthor(updateInput);

    expect(result.name).toEqual('Test Author'); // Should remain unchanged
    expect(result.bio).toEqual('Updated bio content');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update author image_url', async () => {
    const author = await createTestAuthor({
      name: 'Test Author',
      image_url: 'https://example.com/old.jpg'
    });

    const updateInput: UpdateAuthorInput = {
      id: author.id,
      image_url: 'https://example.com/new.jpg'
    };

    const result = await updateAuthor(updateInput);

    expect(result.name).toEqual('Test Author'); // Should remain unchanged
    expect(result.image_url).toEqual('https://example.com/new.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set bio to null', async () => {
    const author = await createTestAuthor({
      name: 'Test Author',
      bio: 'Some bio'
    });

    const updateInput: UpdateAuthorInput = {
      id: author.id,
      bio: null
    };

    const result = await updateAuthor(updateInput);

    expect(result.bio).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const author = await createTestAuthor({
      name: 'Original Name',
      bio: 'Original bio',
      image_url: 'https://example.com/old.jpg'
    });

    const updateInput: UpdateAuthorInput = {
      id: author.id,
      name: 'New Name',
      bio: 'New bio',
      image_url: 'https://example.com/new.jpg'
    };

    const result = await updateAuthor(updateInput);

    expect(result.name).toEqual('New Name');
    expect(result.bio).toEqual('New bio');
    expect(result.image_url).toEqual('https://example.com/new.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const author = await createTestAuthor({
      name: 'Test Author',
      bio: 'Test bio'
    });

    const updateInput: UpdateAuthorInput = {
      id: author.id,
      name: 'Updated Name'
    };

    await updateAuthor(updateInput);

    // Verify changes were saved to database
    const savedAuthor = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, author.id))
      .execute();

    expect(savedAuthor).toHaveLength(1);
    expect(savedAuthor[0].name).toEqual('Updated Name');
    expect(savedAuthor[0].bio).toEqual('Test bio');
    expect(savedAuthor[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent author', async () => {
    const updateInput: UpdateAuthorInput = {
      id: 99999,
      name: 'New Name'
    };

    await expect(updateAuthor(updateInput)).rejects.toThrow(/not found/i);
  });
});
