
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type UpdateAdPlacementInput, type CreateAdPlacementInput } from '../schema';
import { updateAdPlacement } from '../handlers/update_ad_placement';
import { eq } from 'drizzle-orm';

// Test data
const testAdPlacement: CreateAdPlacementInput = {
  name: 'Test Banner Ad',
  placement_type: 'banner',
  ad_script: '<script>console.log("test ad")</script>',
  is_active: true
};

const updateInput: UpdateAdPlacementInput = {
  id: 1, // Will be updated with actual ID
  name: 'Updated Banner Ad',
  placement_type: 'interstitial',
  ad_script: '<script>console.log("updated ad")</script>',
  is_active: false
};

describe('updateAdPlacement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an ad placement', async () => {
    // Create test ad placement first
    const createResult = await db.insert(adPlacementsTable)
      .values(testAdPlacement)
      .returning()
      .execute();

    const createdAdPlacement = createResult[0];
    
    // Update the ad placement
    const updateData = { ...updateInput, id: createdAdPlacement.id };
    const result = await updateAdPlacement(updateData);

    // Verify updated fields
    expect(result.id).toEqual(createdAdPlacement.id);
    expect(result.name).toEqual('Updated Banner Ad');
    expect(result.placement_type).toEqual('interstitial');
    expect(result.ad_script).toEqual('<script>console.log("updated ad")</script>');
    expect(result.is_active).toEqual(false);
    expect(result.created_at).toEqual(createdAdPlacement.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdAdPlacement.updated_at).toBe(true);
  });

  it('should update ad placement in database', async () => {
    // Create test ad placement first
    const createResult = await db.insert(adPlacementsTable)
      .values(testAdPlacement)
      .returning()
      .execute();

    const createdAdPlacement = createResult[0];
    
    // Update the ad placement
    const updateData = { ...updateInput, id: createdAdPlacement.id };
    await updateAdPlacement(updateData);

    // Verify database record was updated
    const adPlacements = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.id, createdAdPlacement.id))
      .execute();

    expect(adPlacements).toHaveLength(1);
    const updatedAdPlacement = adPlacements[0];
    expect(updatedAdPlacement.name).toEqual('Updated Banner Ad');
    expect(updatedAdPlacement.placement_type).toEqual('interstitial');
    expect(updatedAdPlacement.ad_script).toEqual('<script>console.log("updated ad")</script>');
    expect(updatedAdPlacement.is_active).toEqual(false);
    expect(updatedAdPlacement.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create test ad placement first
    const createResult = await db.insert(adPlacementsTable)
      .values(testAdPlacement)
      .returning()
      .execute();

    const createdAdPlacement = createResult[0];
    
    // Update only name and is_active
    const partialUpdate: UpdateAdPlacementInput = {
      id: createdAdPlacement.id,
      name: 'Partially Updated Ad',
      is_active: false
    };

    const result = await updateAdPlacement(partialUpdate);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Partially Updated Ad');
    expect(result.is_active).toEqual(false);
    // These should remain unchanged
    expect(result.placement_type).toEqual('banner');
    expect(result.ad_script).toEqual('<script>console.log("test ad")</script>');
    expect(result.created_at).toEqual(createdAdPlacement.created_at);
    expect(result.updated_at > createdAdPlacement.updated_at).toBe(true);
  });

  it('should throw error for non-existent ad placement', async () => {
    const nonExistentUpdate: UpdateAdPlacementInput = {
      id: 999,
      name: 'Non-existent Ad'
    };

    expect(updateAdPlacement(nonExistentUpdate)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    // Create test ad placement first
    const createResult = await db.insert(adPlacementsTable)
      .values(testAdPlacement)
      .returning()
      .execute();

    const createdAdPlacement = createResult[0];
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update with only ID (no field changes)
    const emptyUpdate: UpdateAdPlacementInput = {
      id: createdAdPlacement.id
    };

    const result = await updateAdPlacement(emptyUpdate);

    // Verify updated_at was still updated
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdAdPlacement.updated_at).toBe(true);
    // Other fields should remain the same
    expect(result.name).toEqual(createdAdPlacement.name);
    expect(result.placement_type).toEqual(createdAdPlacement.placement_type);
    expect(result.ad_script).toEqual(createdAdPlacement.ad_script);
    expect(result.is_active).toEqual(createdAdPlacement.is_active);
  });
});
