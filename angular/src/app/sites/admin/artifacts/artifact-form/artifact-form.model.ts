import { ArtifactFormData, ArtifactPieceFormData } from '../../services/admin-api.service';
import { createUid, ImageSlot } from '../../shared/admin-full-resource.model';

/** A set can drop at several rarities; each has its own how-to-obtain list. */
export const ARTIFACT_RARITIES = [1, 2, 3, 4, 5] as const;

export type ArtifactRarity = (typeof ARTIFACT_RARITIES)[number];

/** Indexed access to the per-rarity columns, so the template can loop. */
export type IndexedArtifact = ArtifactFormData & Record<string, unknown>;

export interface ArtifactWrapper {
  data: IndexedArtifact;
  images: Partial<Record<'icon', ImageSlot>>;
}

export interface PieceWrapper {
  uid: number;
  data: ArtifactPieceFormData;
  images: Partial<Record<'icon', ImageSlot>>;
}

export function emptyArtifact(): ArtifactWrapper {
  return { data: { name: '', icon: '', has_rarity_5: true } as IndexedArtifact, images: {} };
}

export function emptyPiece(type: string): PieceWrapper {
  return { uid: createUid(), data: { name: '', type, icon: '' }, images: {} };
}
