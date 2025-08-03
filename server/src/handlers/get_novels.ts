
import { db } from '../db';
import { novelsTable, authorsTable, novelGenresTable, genresTable } from '../db/schema';
import { type Novel } from '../schema';
import { eq } from 'drizzle-orm';

export async function getNovelsList(): Promise<Novel[]> {
  try {
    // Get all novels with their authors
    const results = await db.select()
      .from(novelsTable)
      .innerJoin(authorsTable, eq(novelsTable.author_id, authorsTable.id))
      .execute();

    // Convert the results to Novel format
    return results.map(result => ({
      id: result.novels.id,
      title: result.novels.title,
      description: result.novels.description,
      author_id: result.novels.author_id,
      cover_image_url: result.novels.cover_image_url,
      status: result.novels.status,
      is_featured: result.novels.is_featured,
      total_chapters: result.novels.total_chapters,
      total_views: result.novels.total_views,
      created_at: result.novels.created_at,
      updated_at: result.novels.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch novels:', error);
    throw error;
  }
}
