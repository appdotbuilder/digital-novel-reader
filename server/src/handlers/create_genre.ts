
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type CreateGenreInput, type Genre } from '../schema';

export const createGenre = async (input: CreateGenreInput): Promise<Genre> => {
  try {
    // Insert genre record
    const result = await db.insert(genresTable)
      .values({
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Genre creation failed:', error);
    throw error;
  }
};
