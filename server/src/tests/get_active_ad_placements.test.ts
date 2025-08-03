
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type CreateAdPlacementInput } from '../schema';
import { getActiveAdPlacements } from '../handlers/get_active_ad_placements';

// Test inputs
const activeAdPlacement: CreateAdPlacementInput = {
  name: 'Homepage Banner',
  placement_type: 'banner',
  ad_script: '<script>console.log("banner ad");</script>',
  is_active: true
};

const inactiveAdPlacement: CreateAdPlacementInput = {
  name: 'Sidebar Ad',
  placement_type: 'native',
  ad_script: '<script>console.log("sidebar ad");</script>',
  is_active: false
};

describe('getActiveAdPlacements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only active ad placements', async () => {
    // Create both active and inactive ad placements
    await db.insert(adPlacementsTable)
      .values([activeAdPlacement, inactiveAdPlacement])
      .execute();

    const result = await getActiveAdPlacements();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Homepage Banner');
    expect(result[0].placement_type).toEqual('banner');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no active ad placements exist', async () => {
    // Create only inactive ad placements
    await db.insert(adPlacementsTable)
      .values([inactiveAdPlacement])
      .execute();

    const result = await getActiveAdPlacements();

    expect(result).toHaveLength(0);
  });

  it('should return all active ad placements when multiple exist', async () => {
    const anotherActiveAd: CreateAdPlacementInput = {
      name: 'Interstitial Ad',
      placement_type: 'interstitial',
      ad_script: '<script>console.log("interstitial ad");</script>',
      is_active: true
    };

    // Create multiple active and one inactive ad placement
    await db.insert(adPlacementsTable)
      .values([activeAdPlacement, anotherActiveAd, inactiveAdPlacement])
      .execute();

    const result = await getActiveAdPlacements();

    expect(result).toHaveLength(2);
    
    const activeResults = result.filter(ad => ad.is_active);
    expect(activeResults).toHaveLength(2);
    
    const adNames = result.map(ad => ad.name);
    expect(adNames).toContain('Homepage Banner');
    expect(adNames).toContain('Interstitial Ad');
    expect(adNames).not.toContain('Sidebar Ad');
  });

  it('should return empty array when no ad placements exist', async () => {
    const result = await getActiveAdPlacements();

    expect(result).toHaveLength(0);
  });
});
