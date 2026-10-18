import type { Place } from '../module_bindings/types';
import { hasCoordinates } from './journey';

export type PlaceCategory = 'beach' | 'site' | 'village';

export interface CategoryMeta {
  id: PlaceCategory;
  singular: string;
  plural: string;
  color: string;
}

/** Display order + colours for each place category. */
export const PLACE_CATEGORIES: CategoryMeta[] = [
  { id: 'beach', singular: 'Beach', plural: 'Beaches', color: '#e0a93b' },
  { id: 'site', singular: 'Site & attraction', plural: 'Sites & attractions', color: '#8b5cf6' },
  { id: 'village', singular: 'Village', plural: 'Villages', color: '#10b981' },
];

const FALLBACK: CategoryMeta = {
  id: 'village',
  singular: 'Place',
  plural: 'Places',
  color: '#64748b',
};

export function categoryMeta(category: string): CategoryMeta {
  return PLACE_CATEGORIES.find(c => c.id === category) ?? FALLBACK;
}

export interface PlaceGroup {
  meta: CategoryMeta;
  places: Place[];
}

/** Group places by category, in the canonical category order, dropping empties. */
export function groupPlaces(places: readonly Place[]): PlaceGroup[] {
  return PLACE_CATEGORIES.map(meta => ({
    meta,
    places: places
      .filter(p => p.category === meta.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(group => group.places.length > 0);
}

/** Places with real coordinates (0,0 means pending), for the map. */
export function mappedPlaces(places: readonly Place[]): Place[] {
  return places.filter(hasCoordinates);
}
