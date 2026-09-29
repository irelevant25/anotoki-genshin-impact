/**
 * The lookup tables, one configuration each, keyed by their route path.
 *
 * They all draw through the same page - LookupPageComponent hands its route's
 * configuration to the shared LookupTableComponent - so a new table is a line
 * here and `lookupRoute('its-path')` in admin.routes.ts.
 */
import { Route } from '@angular/router';
import { LookupTableConfig } from '../lookup-table/lookup-table.component';
import { LookupPageComponent } from './lookup-page.component';

export const LOOKUP_PAGES = {
  // Read-only: fixed by the game.
  elements: { title: 'Elements', apiKey: 'elements', readOnly: true },
  'weapon-types': { title: 'Weapon Types', apiKey: 'weapon-types', readOnly: true },
  'character-states': { title: 'Character States', apiKey: 'character-states', readOnly: true },
  rarities: { title: 'Rarities', apiKey: 'rarities', readOnly: true, pkField: 'rarity' },
  'artifact-piece-types': { title: 'Artifact Piece Types', apiKey: 'artifact-piece-types', readOnly: true },

  // Writable.
  'relationship-types': { title: 'Relationship Types', apiKey: 'relationship-types' },
  'talent-types': { title: 'Talent Types', apiKey: 'talent-types' },
  'food-types': { title: 'Food Types', apiKey: 'food-types' },
  'material-types': { title: 'Material Types', apiKey: 'material-types' },
  'material-groups': { title: 'Material Groups', apiKey: 'material-groups' },
  regions: { title: 'Regions', apiKey: 'regions' },
  roles: { title: 'Roles', apiKey: 'roles' },
  'enemy-types': { title: 'Enemy Types', apiKey: 'enemy-types' },
  'domain-levels': { title: 'Domain Levels', apiKey: 'domain-levels' },
  'enemy-families': { title: 'Enemy Families', apiKey: 'enemy-families' },
  'enemy-groups': { title: 'Enemy Groups', apiKey: 'enemy-groups' },
  stats: { title: 'Stats', apiKey: 'stats', pkField: 'name' },
} satisfies Record<string, LookupTableConfig>;

export type LookupPath = keyof typeof LOOKUP_PAGES;

/** The route that draws one lookup table, at the path it is keyed by. */
export function lookupRoute(path: LookupPath): Route {
  return { path, component: LookupPageComponent, data: { lookup: LOOKUP_PAGES[path] } };
}
