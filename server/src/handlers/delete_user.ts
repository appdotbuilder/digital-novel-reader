
import { db } from '../db';
import { usersTable, readingHistoryTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(id: number): Promise<{ success: boolean }> {
  try {
    // Check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // Delete related reading history first (cascade deletion)
    await db.delete(readingHistoryTable)
      .where(eq(readingHistoryTable.user_id, id))
      .execute();

    // Delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}
