
import { db } from '../db';
import { novelsTable, authorsTable, novelGenresTable } from '../db/schema';
import { type SearchNovelsInput, type Novel } from '../schema';
import { eq, ilike, and, or, inArray, desc, SQL } from 'drizzle-orm';

export async function searchNovels(input: SearchNovelsInput): Promise<Novel[]> {
  try {
    // Collect conditions for filtering
    const conditions: SQL<unknown>[] = [];

    // Handle text search in title or author name
    if (input.query) {
      // We need to join with authors for name search
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
        updated_at: novelsTable.updated_at,
      })
        .from(novelsTable)
        .innerJoin(authorsTable, eq(novelsTable.author_id, authorsTable.id))
        .where(
          and(
            or(
              ilike(novelsTable.title, `%${input.query}%`),
              ilike(authorsTable.name, `%${input.query}%`)
            ),
            ...(input.status ? [eq(novelsTable.status, input.status)] : []),
            ...(input.author_id ? [eq(novelsTable.author_id, input.author_id)] : [])
          )
        )
        .orderBy(desc(novelsTable.updated_at))
        .limit(input.limit || 20)
        .offset(input.offset || 0)
        .execute();

      // Filter by genres if specified
      if (input.genre_ids && input.genre_ids.length > 0) {
        const novelIdsWithGenres = await db.select({ novel_id: novelGenresTable.novel_id })
          .from(novelGenresTable)
          .where(inArray(novelGenresTable.genre_id, input.genre_ids))
          .execute();
        
        const genreNovelIds = new Set(novelIdsWithGenres.map(row => row.novel_id));
        
        return results
          .filter(novel => genreNovelIds.has(novel.id))
          .map(novel => ({
            ...novel,
            created_at: new Date(novel.created_at),
            updated_at: new Date(novel.updated_at)
          }));
      }

      return results.map(novel => ({
        ...novel,
        created_at: new Date(novel.created_at),
        updated_at: new Date(novel.updated_at)
      }));
    }

    // No text search - use simpler query
    // Filter by status
    if (input.status) {
      conditions.push(eq(novelsTable.status, input.status));
    }

    // Filter by specific author
    if (input.author_id) {
      conditions.push(eq(novelsTable.author_id, input.author_id));
    }

    // Filter by genres (if novel has any of the specified genres)
    if (input.genre_ids && input.genre_ids.length > 0) {
      const novelIdsWithGenres = await db.select({ novel_id: novelGenresTable.novel_id })
        .from(novelGenresTable)
        .where(inArray(novelGenresTable.genre_id, input.genre_ids))
        .execute();
      
      const ids = novelIdsWithGenres.map(row => row.novel_id);
      
      if (ids.length > 0) {
        conditions.push(inArray(novelsTable.id, ids));
      } else {
        // No novels found with specified genres, return empty array
        return [];
      }
    }

    // Build the final query
    const baseQuery = db.select().from(novelsTable);
    
    const query = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query
      .orderBy(desc(novelsTable.updated_at))
      .limit(input.limit || 20)
      .offset(input.offset || 0)
      .execute();

    return results.map(novel => ({
      ...novel,
      created_at: new Date(novel.created_at),
      updated_at: new Date(novel.updated_at)
    }));
  } catch (error) {
    console.error('Novel search failed:', error);
    throw error;
  }
}
