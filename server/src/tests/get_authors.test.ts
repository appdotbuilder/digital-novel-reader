
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { authorsTable } from '../db/schema';
import { type CreateAuthorInput } from '../schema';
import { getAuthors } from '../handlers/get_authors';

const testAuthor1: CreateAuthorInput = {
  name: 'John Doe',
  bio: 'A prolific writer',
  image_url: 'https://example.com/john.jpg'
};

const testAuthor2: CreateAuthorInput = {
  name: 'Jane Smith',
  bio: null,
  image_url: null
};

describe('getAuthors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no authors exist', async () => {
    const result = await getAuthors();

    expect(result).toEqual([]);
  });

  it('should return all authors', async () => {
    // Create test authors
    await db.insert(authorsTable)
      .values([testAuthor1, testAuthor2])
      .execute();

    const result = await getAuthors();

    expect(result).toHaveLength(2);
    
    // Check first author
    const author1 = result.find(a => a.name === 'John Doe');
    expect(author1).toBeDefined();
    expect(author1!.bio).toEqual('A prolific writer');
    expect(author1!.image_url).toEqual('https://example.com/john.jpg');
    expect(author1!.id).toBeDefined();
    expect(author1!.created_at).toBeInstanceOf(Date);
    expect(author1!.updated_at).toBeInstanceOf(Date);

    // Check second author
    const author2 = result.find(a => a.name === 'Jane Smith');
    expect(author2).toBeDefined();
    expect(author2!.bio).toBeNull();
    expect(author2!.image_url).toBeNull();
    expect(author2!.id).toBeDefined();
    expect(author2!.created_at).toBeInstanceOf(Date);
    expect(author2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return authors in order of creation', async () => {
    // Create first author
    await db.insert(authorsTable)
      .values(testAuthor1)
      .execute();

    // Create second author
    await db.insert(authorsTable)
      .values(testAuthor2)
      .execute();

    const result = await getAuthors();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
