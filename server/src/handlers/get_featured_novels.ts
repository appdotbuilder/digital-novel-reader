
import { db } from '../db';
import { novelsTable, authorsTable } from '../db/schema';
import { type Novel } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFeaturedNovels(): Promise<Novel[]> {
  try {
    const results = await db.select({
      id: novelsTable.id,
      title: novelsTable.title,
      description: novelsTable.description,
      author_id: novelsTable.author_id,
      cover_image_url: novelsTable.cover_image_url,
      status: novelsTable.status,
      is_featured: novelsTable.is_featured,
      total_chapters: novelsTable.total_chapters,
      total_views: novelsTable.total_views,
      created_at: novelsTable.created_at,
      updated_at: novelsTable.updated_at
    })
    .from(novelsTable)
    .innerJoin(authorsTable, eq(novelsTable.author_id, authorsTable.id))
    .where(eq(novelsTable.is_featured, true))
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch featured novels:', error);
    throw error;
  }
}
