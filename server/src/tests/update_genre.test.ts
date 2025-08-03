
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type CreateGenreInput, type UpdateGenreInput } from '../schema';
import { updateGenre } from '../handlers/update_genre';
import { eq } from 'drizzle-orm';

// Test data
const testCreateInput: CreateGenreInput = {
  name: 'Original Genre',
  description: 'Original description'
};

const testUpdateInput: UpdateGenreInput = {
  id: 1, // Will be set to actual ID in tests
  name: 'Updated Genre',
  description: 'Updated description'
};

describe('updateGenre', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update genre name and description', async () => {
    // Create initial genre
    const created = await db.insert(genresTable)
      .values({
        name: testCreateInput.name,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const updateInput = {
      ...testUpdateInput,
      id: created[0].id
    };

    const result = await updateGenre(updateInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.name).toEqual('Updated Genre');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(created[0].created_at);
  });

  it('should update only name when description not provided', async () => {
    // Create initial genre
    const created = await db.insert(genresTable)
      .values({
        name: testCreateInput.name,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const updateInput: UpdateGenreInput = {
      id: created[0].id,
      name: 'Only Name Updated'
    };

    const result = await updateGenre(updateInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.name).toEqual('Only Name Updated');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.created_at).toEqual(created[0].created_at);
  });

  it('should update only description when name not provided', async () => {
    // Create initial genre
    const created = await db.insert(genresTable)
      .values({
        name: testCreateInput.name,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const updateInput: UpdateGenreInput = {
      id: created[0].id,
      description: 'Only Description Updated'
    };

    const result = await updateGenre(updateInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.name).toEqual('Original Genre'); // Should remain unchanged
    expect(result.description).toEqual('Only Description Updated');
    expect(result.created_at).toEqual(created[0].created_at);
  });

  it('should handle null description', async () => {
    // Create initial genre
    const created = await db.insert(genresTable)
      .values({
        name: testCreateInput.name,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const updateInput: UpdateGenreInput = {
      id: created[0].id,
      description: null
    };

    const result = await updateGenre(updateInput);

    expect(result.id).toEqual(created[0].id);
    expect(result.name).toEqual('Original Genre'); // Should remain unchanged
    expect(result.description).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create initial genre
    const created = await db.insert(genresTable)
      .values({
        name: testCreateInput.name,
        description: testCreateInput.description
      })
      .returning()
      .execute();

    const updateInput = {
      ...testUpdateInput,
      id: created[0].id
    };

    await updateGenre(updateInput);

    // Verify changes persisted in database
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, created[0].id))
      .execute();

    expect(genres).toHaveLength(1);
    expect(genres[0].name).toEqual('Updated Genre');
    expect(genres[0].description).toEqual('Updated description');
    expect(genres[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when genre not found', async () => {
    const updateInput: UpdateGenreInput = {
      id: 999999, // Non-existent ID
      name: 'Updated Name'
    };

    expect(updateGenre(updateInput)).rejects.toThrow(/Genre with id 999999 not found/i);
  });
});
