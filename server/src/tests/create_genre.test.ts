
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type CreateGenreInput } from '../schema';
import { createGenre } from '../handlers/create_genre';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateGenreInput = {
  name: 'Fantasy',
  description: 'A genre featuring magical and supernatural elements'
};

// Test input with minimal required fields
const minimalInput: CreateGenreInput = {
  name: 'Science Fiction'
};

describe('createGenre', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a genre with all fields', async () => {
    const result = await createGenre(testInput);

    // Basic field validation
    expect(result.name).toEqual('Fantasy');
    expect(result.description).toEqual('A genre featuring magical and supernatural elements');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a genre with minimal fields', async () => {
    const result = await createGenre(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Science Fiction');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save genre to database', async () => {
    const result = await createGenre(testInput);

    // Query using proper drizzle syntax
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, result.id))
      .execute();

    expect(genres).toHaveLength(1);
    expect(genres[0].name).toEqual('Fantasy');
    expect(genres[0].description).toEqual('A genre featuring magical and supernatural elements');
    expect(genres[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const result = await createGenre(minimalInput);

    // Query database to verify null handling
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, result.id))
      .execute();

    expect(genres).toHaveLength(1);
    expect(genres[0].name).toEqual('Science Fiction');
    expect(genres[0].description).toBeNull();
  });

  it('should enforce unique name constraint', async () => {
    // Create first genre
    await createGenre(testInput);

    // Attempt to create genre with same name should fail
    await expect(createGenre(testInput)).rejects.toThrow(/unique/i);
  });
});
