
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { genresTable } from '../db/schema';
import { getGenres } from '../handlers/get_genres';

describe('getGenres', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no genres exist', async () => {
    const result = await getGenres();

    expect(result).toEqual([]);
  });

  it('should return all genres', async () => {
    // Create test genres
    await db.insert(genresTable)
      .values([
        {
          name: 'Fantasy',
          description: 'Fantasy novels'
        },
        {
          name: 'Romance',
          description: 'Romance novels'
        },
        {
          name: 'Sci-Fi',
          description: null
        }
      ])
      .execute();

    const result = await getGenres();

    expect(result).toHaveLength(3);
    
    // Check first genre
    const fantasy = result.find(g => g.name === 'Fantasy');
    expect(fantasy).toBeDefined();
    expect(fantasy!.description).toEqual('Fantasy novels');
    expect(fantasy!.id).toBeTypeOf('number');
    expect(fantasy!.created_at).toBeInstanceOf(Date);

    // Check second genre
    const romance = result.find(g => g.name === 'Romance');
    expect(romance).toBeDefined();
    expect(romance!.description).toEqual('Romance novels');

    // Check third genre (with null description)
    const scifi = result.find(g => g.name === 'Sci-Fi');
    expect(scifi).toBeDefined();
    expect(scifi!.description).toBeNull();
  });

  it('should return genres with proper field types', async () => {
    await db.insert(genresTable)
      .values({
        name: 'Test Genre',
        description: 'A test genre'
      })
      .execute();

    const result = await getGenres();

    expect(result).toHaveLength(1);
    const genre = result[0];
    
    expect(typeof genre.id).toBe('number');
    expect(typeof genre.name).toBe('string');
    expect(typeof genre.description).toBe('string');
    expect(genre.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple genres with unique names', async () => {
    const testGenres = [
      { name: 'Action', description: 'Action-packed stories' },
      { name: 'Drama', description: 'Dramatic narratives' },
      { name: 'Comedy', description: 'Humorous content' },
      { name: 'Horror', description: null }
    ];

    await db.insert(genresTable)
      .values(testGenres)
      .execute();

    const result = await getGenres();

    expect(result).toHaveLength(4);
    
    // Verify all genres are returned
    const genreNames = result.map(g => g.name);
    expect(genreNames).toContain('Action');
    expect(genreNames).toContain('Drama');
    expect(genreNames).toContain('Comedy');
    expect(genreNames).toContain('Horror');

    // Verify each genre has required properties
    result.forEach(genre => {
      expect(genre.id).toBeTypeOf('number');
      expect(genre.name).toBeTypeOf('string');
      expect(genre.created_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(genre.description === null || typeof genre.description === 'string').toBe(true);
    });
  });
});
