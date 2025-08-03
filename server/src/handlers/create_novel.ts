
import { db } from '../db';
import { novelsTable, novelGenresTable, authorsTable } from '../db/schema';
import { type CreateNovelInput, type Novel } from '../schema';
import { eq } from 'drizzle-orm';

export const createNovel = async (input: CreateNovelInput): Promise<Novel> => {
  try {
    // Verify author exists
    const existingAuthor = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, input.author_id))
      .execute();

    if (existingAuthor.length === 0) {
      throw new Error(`Author with id ${input.author_id} does not exist`);
    }

    // Insert novel record
    const result = await db.insert(novelsTable)
      .values({
        title: input.title,
        description: input.description,
        author_id: input.author_id,
        cover_image_url: input.cover_image_url || null,
        status: input.status,
        is_featured: input.is_featured || false,
        total_chapters: 0,
        total_views: 0
      })
      .returning()
      .execute();

    const novel = result[0];

    // Handle genre associations if provided
    if (input.genre_ids && input.genre_ids.length > 0) {
      const genreAssociations = input.genre_ids.map(genreId => ({
        novel_id: novel.id,
        genre_id: genreId
      }));

      await db.insert(novelGenresTable)
        .values(genreAssociations)
        .execute();
    }

    return novel;
  } catch (error) {
    console.error('Novel creation failed:', error);
    throw error;
  }
};
