import { describe, expect, it } from 'vitest';
import type { Place } from '../module_bindings/types';
import { categoryMeta, groupPlaces, mappedPlaces } from './places';

function place(id: number, name: string, category: string, lat = 17, lng = -61): Place {
  return { id: BigInt(id), name, category, lat, lng, description: '', nearestStopId: 0n };
}

describe('categoryMeta', () => {
  it('resolves known categories', () => {
    expect(categoryMeta('beach').singular).toBe('Beach');
    expect(categoryMeta('site').plural).toBe('Sites & attractions');
  });

  it('falls back for unknown categories', () => {
    expect(categoryMeta('ruins').singular).toBe('Place');
  });
});

describe('groupPlaces', () => {
  it('groups in category order and sorts by name within a group', () => {
    const groups = groupPlaces([
      place(1, 'Zoo', 'site'),
      place(2, 'Jolly Beach', 'beach'),
      place(3, 'Darkwood Beach', 'beach'),
    ]);
    expect(groups.map(g => g.meta.id)).toEqual(['beach', 'site']);
    expect(groups[0].places.map(p => p.name)).toEqual(['Darkwood Beach', 'Jolly Beach']);
  });

  it('drops empty categories', () => {
    const groups = groupPlaces([place(1, 'Jolly Beach', 'beach')]);
    expect(groups).toHaveLength(1);
  });
});

describe('mappedPlaces', () => {
  it('excludes places with no coordinates', () => {
    const mapped = mappedPlaces([place(1, 'Placed', 'beach'), place(2, 'Pending', 'beach', 0, 0)]);
    expect(mapped.map(p => p.name)).toEqual(['Placed']);
  });
});
