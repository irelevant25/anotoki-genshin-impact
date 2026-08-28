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

export interface DropWrapper {
  uid: number;
  data: EnemyDropFormData;
}

export function emptyEnemy(): EnemyWrapper {
  return { data: { name: '', icon: '' }, images: {} };
}

export function emptyPhase(): PhaseWrapper {
  return { uid: createUid(), data: { title: '', icon: '', has_weakpoint: false }, images: {}, elements: [] };
}

export function emptyDrop(): DropWrapper {
  return { uid: createUid(), data: {} };
}
