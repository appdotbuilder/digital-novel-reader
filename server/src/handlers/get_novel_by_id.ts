
import { db } from '../db';
import { novelsTable } from '../db/schema';
import { type Novel } from '../schema';
import { eq } from 'drizzle-orm';

export const getNovelById = async (id: number): Promise<Novel | null> => {
  try {
    const results = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const novel = results[0];
    return {
      ...novel,
      // All fields are already in correct types from the database
      id: novel.id,
      title: novel.title,
      description: novel.description,
      author_id: novel.author_id,
      cover_image_url: novel.cover_image_url,
      status: novel.status,
      is_featured: novel.is_featured,
      total_chapters: novel.total_chapters,
      total_views: novel.total_views,
      created_at: novel.created_at,
      updated_at: novel.updated_at
    };
  } catch (error) {
    console.error('Failed to get novel by id:', error);
    throw error;
  }
};
