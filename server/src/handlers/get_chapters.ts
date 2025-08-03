
import { db } from '../db';
import { chaptersTable } from '../db/schema';
import { type GetChaptersInput, type Chapter } from '../schema';
import { eq, and, asc } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export async function getChapters(input: GetChaptersInput): Promise<Chapter[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by novel_id
    conditions.push(eq(chaptersTable.novel_id, input.novel_id));
    
    // Add published filter if requested
    if (input.published_only === true) {
      conditions.push(eq(chaptersTable.is_published, true));
    }

    // Execute query with proper chaining
    const results = await db.select()
      .from(chaptersTable)
      .where(and(...conditions))
      .orderBy(asc(chaptersTable.chapter_number))
      .execute();

    // No numeric fields to convert in chapters table
    return results;
  } catch (error) {
    console.error('Failed to get chapters:', error);
    throw error;
  }
}
