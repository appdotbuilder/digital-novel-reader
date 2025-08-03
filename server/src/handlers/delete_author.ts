
import { db } from '../db';
import { authorsTable, novelsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteAuthor(id: number): Promise<{ success: boolean }> {
  try {
    // Check if author exists
    const existingAuthor = await db.select()
      .from(authorsTable)
      .where(eq(authorsTable.id, id))
      .execute();

    if (existingAuthor.length === 0) {
      throw new Error('Author not found');
    }

    // Check if author has any novels
    const authorNovels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.author_id, id))
      .execute();

    if (authorNovels.length > 0) {
      throw new Error('Cannot delete author with existing novels');
    }

    // Delete the author
    await db.delete(authorsTable)
      .where(eq(authorsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Author deletion failed:', error);
    throw error;
  }
}
