
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable } from '../db/schema';
import { type CreateAuthorInput } from '../schema';
import { createAuthor } from '../handlers/create_author';
import { eq } from 'drizzle-orm';

const testInput: CreateAuthorInput = {
  name: 'Test Author',
  bio: 'A test author biography',
  image_url: 'https://example.com/author.jpg'
};

describe('createAuthor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an author with all fields', async () => {
    const result = await createAuthor(testInput);

    expect(result.name).toEqual('Test Author');
    expect(result.bio).toEqual('A test author biography');
    expect(result.image_url).toEqual('https://example.com/author.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an author with minimal fields', async () => {
    const minimalInput: CreateAuthorInput = {
      name: 'Minimal Author',
      bio: null,
      image_url: null
    };

    const result = await createAuthor(minimalInput);

    expect(result.name).toEqual('Minimal Author');
    expect(result.bio).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an author with optional fields undefined', async () => {
    const undefinedInput: CreateAuthorInput = {
      name: 'Another Author'
      // bio and image_url are undefined (optional)
    };

    const result = await createAuthor(undefinedInput);

    expect(result.name).toEqual('Another Author');
    expect(result.bio).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save author to database', async () => {
    const result = await createAuthor(testInput);

    const authors = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, result.id))
      .execute();

    expect(authors).toHaveLength(1);
    expect(authors[0].name).toEqual('Test Author');
    expect(authors[0].bio).toEqual('A test author biography');
    expect(authors[0].image_url).toEqual('https://example.com/author.jpg');
    expect(authors[0].created_at).toBeInstanceOf(Date);
    expect(authors[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle unique name constraint', async () => {
    // Create first author
    await createAuthor(testInput);

    // Try to create author with same name should succeed
    // (no unique constraint on name in the schema)
    const duplicateInput: CreateAuthorInput = {
      name: 'Test Author',
      bio: 'Different bio',
      image_url: null
    };

    const result = await createAuthor(duplicateInput);
    expect(result.name).toEqual('Test Author');
    expect(result.bio).toEqual('Different bio');
  });
});
