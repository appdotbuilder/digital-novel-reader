
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type CreateAdPlacementInput, type AdPlacement } from '../schema';

export const createAdPlacement = async (input: CreateAdPlacementInput): Promise<AdPlacement> => {
  try {
    // Insert ad placement record
    const result = await db.insert(adPlacementsTable)
      .values({
        name: input.name,
        placement_type: input.placement_type,
        ad_script: input.ad_script,
        is_active: input.is_active ?? true // Use default if not provided
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Ad placement creation failed:', error);
    throw error;
  }
};
