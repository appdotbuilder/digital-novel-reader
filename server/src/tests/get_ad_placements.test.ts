
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adPlacementsTable } from '../db/schema';
import { type CreateAdPlacementInput } from '../schema';
import { getAdPlacements } from '../handlers/get_ad_placements';

describe('getAdPlacements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no ad placements exist', async () => {
    const result = await getAdPlacements();
    expect(result).toEqual([]);
  });

  it('should return all ad placements', async () => {
    // Create test ad placements
    const testPlacements = [
      {
        name: 'Header Banner',
        placement_type: 'banner' as const,
        ad_script: '<script>console.log("header banner");</script>',
        is_active: true
      },
      {
        name: 'Interstitial Ad',
        placement_type: 'interstitial' as const,
        ad_script: '<script>console.log("interstitial");</script>',
        is_active: false
      },
      {
        name: 'Native Content',
        placement_type: 'native' as const,
        ad_script: '<script>console.log("native");</script>',
        is_active: true
      }
    ];

    // Insert test data
    await db.insert(adPlacementsTable)
      .values(testPlacements)
      .execute();

    const result = await getAdPlacements();

    expect(result).toHaveLength(3);
    
    // Check that all placements are returned
    const names = result.map(p => p.name);
    expect(names).toContain('Header Banner');
    expect(names).toContain('Interstitial Ad');
    expect(names).toContain('Native Content');

    // Verify structure of returned data
    result.forEach(placement => {
      expect(placement.id).toBeDefined();
      expect(placement.name).toBeDefined();
      expect(placement.placement_type).toBeDefined();
      expect(placement.ad_script).toBeDefined();
      expect(typeof placement.is_active).toBe('boolean');
      expect(placement.created_at).toBeInstanceOf(Date);
      expect(placement.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return placements with correct placement types', async () => {
    const testPlacement = {
      name: 'Test Banner',
      placement_type: 'banner' as const,
      ad_script: '<script>test</script>',
      is_active: true
    };

    await db.insert(adPlacementsTable)
      .values([testPlacement])
      .execute();

    const result = await getAdPlacements();

    expect(result).toHaveLength(1);
    expect(result[0].placement_type).toBe('banner');
    expect(['banner', 'interstitial', 'native']).toContain(result[0].placement_type);
  });

  it('should return both active and inactive placements', async () => {
    const testPlacements = [
      {
        name: 'Active Ad',
        placement_type: 'banner' as const,
        ad_script: '<script>active</script>',
        is_active: true
      },
      {
        name: 'Inactive Ad',
        placement_type: 'native' as const,
        ad_script: '<script>inactive</script>',
        is_active: false
      }
    ];

    await db.insert(adPlacementsTable)
      .values(testPlacements)
      .execute();

    const result = await getAdPlacements();

    expect(result).toHaveLength(2);
    
    const activeAd = result.find(p => p.name === 'Active Ad');
    const inactiveAd = result.find(p => p.name === 'Inactive Ad');
    
    expect(activeAd?.is_active).toBe(true);
    expect(inactiveAd?.is_active).toBe(false);
  });
});
