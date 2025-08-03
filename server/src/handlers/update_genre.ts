
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type UpdateGenreInput, type Genre } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGenre = async (input: UpdateGenreInput): Promise<Genre> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    // Update genre record
    const result = await db.update(genresTable)
      .set(updateData)
      .where(eq(genresTable.id, input.id))
      .returning()
      .execute();
    
    if (result.length === 0) {
      throw new Error(`Genre with id ${input.id} not found`);
    }
    
    return result[0];
  } catch (error) {
    console.error('Genre update failed:', error);
    throw error;
  }
};
