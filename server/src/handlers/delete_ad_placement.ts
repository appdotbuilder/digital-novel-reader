
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteAdPlacement(id: number): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(adPlacementsTable)
      .where(eq(adPlacementsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Ad placement deletion failed:', error);
    throw error;
  }
}
