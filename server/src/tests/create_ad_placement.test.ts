
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type CreateAdPlacementInput } from '../schema';
import { createAdPlacement } from '../handlers/create_ad_placement';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateAdPlacementInput = {
  name: 'Test Banner Ad',
  placement_type: 'banner',
  ad_script: '<script>console.log("banner ad");</script>',
  is_active: true
};

describe('createAdPlacement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an ad placement', async () => {
    const result = await createAdPlacement(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Banner Ad');
    expect(result.placement_type).toEqual('banner');
    expect(result.ad_script).toEqual('<script>console.log("banner ad");</script>');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save ad placement to database', async () => {
    const result = await createAdPlacement(testInput);

    // Query using proper drizzle syntax
    const adPlacements = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.id, result.id))
      .execute();

    expect(adPlacements).toHaveLength(1);
    expect(adPlacements[0].name).toEqual('Test Banner Ad');
    expect(adPlacements[0].placement_type).toEqual('banner');
    expect(adPlacements[0].ad_script).toEqual('<script>console.log("banner ad");</script>');
    expect(adPlacements[0].is_active).toBe(true);
    expect(adPlacements[0].created_at).toBeInstanceOf(Date);
    expect(adPlacements[0].updated_at).toBeInstanceOf(Date);
  });

  it('should default is_active to true when not provided', async () => {
    const inputWithoutActive: CreateAdPlacementInput = {
      name: 'Default Active Ad',
      placement_type: 'interstitial',
      ad_script: '<script>console.log("interstitial ad");</script>'
    };

    const result = await createAdPlacement(inputWithoutActive);

    expect(result.is_active).toBe(true);

    // Verify in database
    const adPlacements = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.id, result.id))
      .execute();

    expect(adPlacements[0].is_active).toBe(true);
  });

  it('should handle different placement types', async () => {
    const nativeAdInput: CreateAdPlacementInput = {
      name: 'Native Ad Test',
      placement_type: 'native',
      ad_script: '<div>Native ad content</div>',
      is_active: false
    };

    const result = await createAdPlacement(nativeAdInput);

    expect(result.placement_type).toEqual('native');
    expect(result.is_active).toBe(false);

    // Verify in database
    const adPlacements = await db.select()
      .from(adPlacementsTable)
      .where(eq(adPlacementsTable.id, result.id))
      .execute();

    expect(adPlacements[0].placement_type).toEqual('native');
    expect(adPlacements[0].is_active).toBe(false);
  });
});
