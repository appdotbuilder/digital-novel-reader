
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type CreateAdPlacementInput } from '../schema';
import { deleteAdPlacement } from '../handlers/delete_ad_placement';
import { eq } from 'drizzle-orm';

// Test input for creating ad placement
const testInput: CreateAdPlacementInput = {
  name: 'Test Banner Ad',
  placement_type: 'banner',
  ad_script: '<script>console.log("test ad");</script>',
  is_active: true
};

describe('deleteAdPlacement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an ad placement', async () => {
    // Create ad placement first
    const createResult = await db.insert(adPlacementsTable)
      .values({
        name: testInput.name,
        placement_type: testInput.placement_type,
        ad_script: testInput.ad_script,
        is_active: testInput.is_active
      })
      .returning()
      .execute();

    const adPlacementId = createResult[0].id;

    // Delete the ad placement
    const result = await deleteAdPlacement(adPlacementId);

    expect(result.success).toBe(true);
  });

  it('should remove ad placement from database', async () => {
    // Create ad placement first
    const createResult = await db.insert(adPlacementsTable)
      .values({
        name: testInput.name,
        placement_type: testInput.placement_type,
        ad_script: testInput.ad_script,
        is_active: testInput.is_active
      })
      .returning()
      .execute();

    const adPlacementId = createResult[0].id;

    // Verify it exists
    const beforeDelete = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.id, adPlacementId))
      .execute();

    expect(beforeDelete).toHaveLength(1);

    // Delete the ad placement
    await deleteAdPlacement(adPlacementId);

    // Verify it's gone
    const afterDelete = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.id, adPlacementId))
      .execute();

    expect(afterDelete).toHaveLength(0);
  });

  it('should handle deletion of non-existent ad placement', async () => {
    const nonExistentId = 999999;

    // Should not throw error even if ad placement doesn't exist
    const result = await deleteAdPlacement(nonExistentId);

    expect(result.success).toBe(true);
  });
});
