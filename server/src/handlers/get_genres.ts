
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type Genre } from '../schema';

export const getGenres = async (): Promise<Genre[]> => {
  try {
    const results = await db.select()
      .from(genresTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    throw error;
  }
};
