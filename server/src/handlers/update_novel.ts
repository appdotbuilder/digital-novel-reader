
import { db } from '../db';
import { novelsTable, novelGenresTable, authorsTable } from '../db/schema';
import { type UpdateNovelInput, type Novel } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateNovel = async (input: UpdateNovelInput): Promise<Novel> => {
  try {
    // First verify the novel exists
    const existingNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, input.id))
      .execute();

    if (existingNovel.length === 0) {
      throw new Error(`Novel with id ${input.id} not found`);
    }

    // If author_id is being updated, verify the author exists
    if (input.author_id !== undefined) {
      const author = await db.select()
        .from(authorsTable)
        .where(eq(authorsTable.id, input.author_id))
        .execute();

      if (author.length === 0) {
        throw new Error(`Author with id ${input.author_id} not found`);
      }
    }

    // Update the novel record
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.author_id !== undefined) updateData.author_id = input.author_id;
    if (input.cover_image_url !== undefined) updateData.cover_image_url = input.cover_image_url;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(novelsTable)
      .set(updateData)
      .where(eq(novelsTable.id, input.id))
      .returning()
      .execute();

    // Handle genre associations if provided
    if (input.genre_ids !== undefined) {
      // Delete existing genre associations
      await db.delete(novelGenresTable)
        .where(eq(novelGenresTable.novel_id, input.id))
        .execute();

      // Insert new genre associations
      if (input.genre_ids.length > 0) {
        const genreInserts = input.genre_ids.map(genre_id => ({
          novel_id: input.id,
          genre_id: genre_id
        }));

        await db.insert(novelGenresTable)
          .values(genreInserts)
          .execute();
      }
    }

    return result[0];
  } catch (error) {
    console.error('Novel update failed:', error);
    throw error;
  }
};
