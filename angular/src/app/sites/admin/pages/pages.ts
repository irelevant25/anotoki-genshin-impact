/**
 * Thin page components for each lookup table — they just pass a config
 * to the shared LookupTableComponent.
 */
import { Component } from '@angular/core';
import { LookupTableComponent, LookupTableConfig } from '../lookup-table/lookup-table.component';

function makePage(cfg: LookupTableConfig) {
  @Component({
    template: '<app-lookup-table [config]="cfg"></app-lookup-table>',
    imports: [LookupTableComponent],
  })
  class Page { cfg = cfg; }
  return Page;
}

export const ElementsPage          = makePage({ title: 'Elements',           apiKey: 'elements',           readOnly: true });
export const WeaponTypesPage       = makePage({ title: 'Weapon Types',        apiKey: 'weapon-types',       readOnly: true });
export const VoiceOverTypesPage    = makePage({ title: 'Voice Over Types',    apiKey: 'voice-over-types',   readOnly: true });
export const CharacterStatesPage   = makePage({ title: 'Character States',    apiKey: 'character-states',   readOnly: true });
export const RaritiesPage          = makePage({ title: 'Rarities',            apiKey: 'rarities',           readOnly: true, pkField: 'rarity' });
export const ArtifactPieceTypesPage= makePage({ title: 'Artifact Piece Types',apiKey: 'artifact-piece-types', readOnly: true });
export const MigrationsPage        = makePage({ title: 'Migrations',          apiKey: 'migrations',         readOnly: true, pkField: 'id' });

export const RelationshipTypesPage = makePage({ title: 'Relationship Types',  apiKey: 'relationship-types' });
export const TalentTypesPage       = makePage({ title: 'Talent Types',        apiKey: 'talent-types' });
export const FoodTypesPage         = makePage({ title: 'Food Types',          apiKey: 'food-types' });
export const MaterialTypesPage     = makePage({ title: 'Material Types',      apiKey: 'material-types' });
export const MaterialGroupsPage    = makePage({ title: 'Material Groups',     apiKey: 'material-groups' });
export const RegionsPage           = makePage({ title: 'Regions',             apiKey: 'regions' });
export const RolesPage             = makePage({ title: 'Roles',               apiKey: 'roles' });
export const EnemyTypesPage        = makePage({ title: 'Enemy Types',         apiKey: 'enemy-types' });
export const DomainLevelsPage      = makePage({ title: 'Domain Levels',       apiKey: 'domain-levels' });
export const EnemyFamiliesPage     = makePage({ title: 'Enemy Families',      apiKey: 'enemy-families' });
export const EnemyGroupsPage       = makePage({ title: 'Enemy Groups',        apiKey: 'enemy-groups' });
export const StatsPage             = makePage({ title: 'Stats',               apiKey: 'stats', pkField: 'id' });
