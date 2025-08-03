
import { db } from '../db';
import { genresTable, novelGenresTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteGenre(id: number): Promise<{ success: boolean }> {
  try {
    // Check if genre exists
    const existingGenre = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, id))
      .execute();

    if (existingGenre.length === 0) {
      throw new Error('Genre not found');
    }

    // Check if genre is used by novels
    const novelGenres = await db.select()
      .from(novelGenresTable)
      .where(eq(novelGenresTable.genre_id, id))
      .execute();

    if (novelGenres.length > 0) {
      throw new Error('Cannot delete genre that is used by novels');
    }

    // Delete the genre
    await db.delete(genresTable)
      .where(eq(genresTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Genre deletion failed:', error);
    throw error;
  }
}
