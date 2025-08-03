
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type AdPlacement } from '../schema';

export async function getAdPlacements(): Promise<AdPlacement[]> {
  try {
    const results = await db.select()
      .from(adPlacementsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch ad placements:', error);
    throw error;
  }
}
