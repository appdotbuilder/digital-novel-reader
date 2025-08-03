
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type AdPlacement } from '../schema';
import { eq } from 'drizzle-orm';

export const getActiveAdPlacements = async (): Promise<AdPlacement[]> => {
  try {
    const results = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch active ad placements:', error);
    throw error;
  }
};
