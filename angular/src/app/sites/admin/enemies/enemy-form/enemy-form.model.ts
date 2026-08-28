import { EnemyDropFormData, EnemyFormData, EnemyPhaseFormData } from '../../services/admin-api.service';
import { createUid, ImageSlot } from '../../shared/admin-full-resource.model';

/** Image columns on the enemy row and on each phase. */
export type EnemyImageField = 'icon';
export type PhaseImageField = 'icon' | 'art';

export interface EnemyWrapper {
  data: EnemyFormData;
  images: Partial<Record<EnemyImageField, ImageSlot>>;
}

export interface PhaseWrapper {
  uid: number;
  data: EnemyPhaseFormData;
  images: Partial<Record<PhaseImageField, ImageSlot>>;
  /** Elements this phase deals damage with, kept ordered. */
  elements: string[];
}

/** A drop row points at either a material or an artifact, never both. */
export type DropKind = 'material' | 'artifact';

export const DROP_KIND_OPTIONS: { key: DropKind; value: string }[] = [
  { key: 'material', value: 'Material' },
  { key: 'artifact', value: 'Artifact' },
];

export interface DropEntryWrapper {
  uid: number;
  kind: DropKind;
  data: EnemyDropFormData;
}

/**
 * Drop rows repeat the same level / world / domain values across every item
 * dropped under those conditions, so the form groups them: the conditions are
 * edited once, and each item carries only its own quantities.
 */
export interface DropGroupWrapper {
  uid: number;
  level_from?: number | null;
  level_to?: number | null;
  world_level?: number | null;
  domain_level?: string | null;
  entries: DropEntryWrapper[];
}

export function emptyEnemy(): EnemyWrapper {
  return { data: { name: '', icon: '' }, images: {} };
}

export function emptyPhase(): PhaseWrapper {
  return { uid: createUid(), data: { title: '', icon: '', has_weakpoint: false }, images: {}, elements: [] };
}

export function emptyDropEntry(kind: DropKind = 'material'): DropEntryWrapper {
  return { uid: createUid(), kind, data: {} };
}

export function emptyDropGroup(): DropGroupWrapper {
  return { uid: createUid(), entries: [emptyDropEntry()] };
}

/** Rows sharing level / world / domain belong to the same group. */
function groupKey(drop: EnemyDropFormData): string {
  return [drop.level_from, drop.level_to, drop.world_level, drop.domain_level].map((value) => value ?? '').join('|');
}

export function groupDrops(drops: EnemyDropFormData[]): DropGroupWrapper[] {
  const groups = new Map<string, DropGroupWrapper>();
  for (const drop of drops) {
    const key = groupKey(drop);
    let group = groups.get(key);
    if (!group) {
      group = {
        uid: createUid(),
        level_from: drop.level_from ?? null,
        level_to: drop.level_to ?? null,
        world_level: drop.world_level ?? null,
        domain_level: drop.domain_level ?? null,
        entries: [],
      };
      groups.set(key, group);
    }
    group.entries.push({
      uid: createUid(),
      kind: drop.artifact_id ? 'artifact' : 'material',
      data: drop,
    });
  }
  return [...groups.values()];
}

/** Expands the groups back into one row per dropped item. */
export function flattenDropGroups(groups: DropGroupWrapper[]): EnemyDropFormData[] {
  return groups.flatMap((group) =>
    group.entries.map((entry) => ({
      ...entry.data,
      material_id: entry.kind === 'material' ? entry.data.material_id ?? null : null,
      artifact_id: entry.kind === 'artifact' ? entry.data.artifact_id ?? null : null,
      level_from: group.level_from ?? null,
      level_to: group.level_to ?? null,
      world_level: group.world_level ?? null,
      domain_level: group.domain_level ?? null,
    }))
  );
}
