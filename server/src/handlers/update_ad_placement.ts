
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type UpdateAdPlacementInput, type AdPlacement } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAdPlacement = async (input: UpdateAdPlacementInput): Promise<AdPlacement> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.placement_type !== undefined) {
      updateData.placement_type = input.placement_type;
    }
    
    if (input.ad_script !== undefined) {
      updateData.ad_script = input.ad_script;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the ad placement record
    const result = await db.update(adPlacementsTable)
      .set(updateData)
      .where(eq(adPlacementsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Ad placement with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Ad placement update failed:', error);
    throw error;
  }
};
