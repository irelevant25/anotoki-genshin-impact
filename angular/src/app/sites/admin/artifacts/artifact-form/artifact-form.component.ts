import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { ArtifactApiService, LookupApiService, ArtifactFull } from '../../../../api';
import { AdminFormComponent, PendingImage } from '../../shared/admin-form.class';
import { buildFullFormData, createUid, revokeAllPicked, toBoolean, toStringArray } from '../../shared/admin-full-resource.model';
import { toAssetBaseName } from '../../shared/asset-name';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { PiecesTabComponent } from './pieces/pieces-tab.component';
import { ARTIFACT_RARITIES, ArtifactWrapper, emptyArtifact, PieceWrapper } from './artifact-form.model';

@Component({
  selector: 'app-artifact-form',
  templateUrl: './artifact-form.component.html',
  styleUrls: ['./artifact-form.component.scss'],
  imports: [RouterLink, ButtonComponent, LoaderComponent, TabsComponent, TabComponent, BaseInfoTabComponent, PiecesTabComponent],
})
export class ArtifactFormComponent extends AdminFormComponent<ArtifactFull> implements OnInit, OnDestroy {
  readonly entityLabel = 'Artifact';
  protected readonly listRoute = '/admin/artifacts';

  artifact = signal<ArtifactWrapper>(emptyArtifact());
  pieces = signal<PieceWrapper[]>([]);

  pieceTypes = signal<string[]>([]);

  private readonly _artifactApi = inject(ArtifactApiService);
  private readonly _lookupApi = inject(LookupApiService);

  ngOnInit(): void {
    this._loadLookups();
    this.initFromRoute();
  }

  ngOnDestroy(): void {
    this.beforeReload();
  }

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({ pieceTypes: this._lookupApi.getArtifactPieceTypes() }).subscribe({
      next: (result) => {
        this.pieceTypes.set(result.pieceTypes.map((entry) => entry.name));
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this.notify.showError('Failed to load form options');
      },
    });
  }

  protected fetch(id: number): Observable<ArtifactFull> {
    return this._artifactApi.getArtifactFull(id);
  }

  protected create(payload: FormData): Observable<{ id: number }> {
    return this._artifactApi.createArtifactFull(payload);
  }

  protected update(id: number, payload: FormData): Observable<unknown> {
    return this._artifactApi.updateArtifactFull(id, payload);
  }

  protected applyLoaded(data: ArtifactFull): void {
    const artifact = { ...data.artifact };
    for (const rarity of ARTIFACT_RARITIES) {
      artifact[`has_rarity_${rarity}`] = toBoolean(artifact[`has_rarity_${rarity}`]);
      artifact[`how_to_obtain_quality_${rarity}`] = toStringArray(artifact[`how_to_obtain_quality_${rarity}`]);
    }
    artifact.effects = toStringArray(artifact.effects);

    this.artifact.set({ data: artifact });
    this.pieces.set((data.pieces ?? []).map((piece) => ({ uid: createUid(), data: piece })));
  }

  protected override beforeReload(): void {
    revokeAllPicked([this.artifact().pending, ...this.pieces().map((piece) => piece.pending)]);
  }

  /**
   * Names are read now rather than when the file was picked, so renaming the
   * set or a piece before saving still stores its picture under the new name.
   */
  protected override collectPendingImages(): PendingImage[] {
    const pending: PendingImage[] = [];
    const artifact = this.artifact();

    if (artifact.pending) {
      pending.push({
        entity: 'artifact',
        field: 'icon',
        picked: artifact.pending,
        name: toAssetBaseName(artifact.data.name),
        apply: (path, name, fileId) => {
          artifact.data.icon = path;
          artifact.data.icon_name = name;
          artifact.data.icon_file_id = fileId;
        },
      });
    }

    for (const piece of this.pieces()) {
      if (piece.pending) {
        pending.push({
          entity: 'artifact-piece',
          field: 'icon',
          picked: piece.pending,
          name: toAssetBaseName(piece.data.name),
          apply: (path, name, fileId) => {
            piece.data.icon = path;
            piece.data.icon_name = name;
            piece.data.icon_file_id = fileId;
          },
        });
      }
    }

    return pending;
  }

  protected buildFormData(): FormData {
    const artifact = this.artifact();

    const data = { ...artifact.data };
    for (const rarity of ARTIFACT_RARITIES) {
      data[`has_rarity_${rarity}`] = !!data[`has_rarity_${rarity}`];
      data[`how_to_obtain_quality_${rarity}`] = toStringArray(data[`how_to_obtain_quality_${rarity}`]);
    }
    data.effects = toStringArray(data.effects);

    return buildFullFormData({ artifact: data, pieces: this.pieces().map((piece) => piece.data) });
  }

  protected override extraValidation(): string | undefined {
    if (!ARTIFACT_RARITIES.some((rarity) => this.artifact().data[`has_rarity_${rarity}`])) {
      return 'Pick at least one rarity the set drops at.';
    }
    const types = this.pieces().map((piece) => piece.data.type);
    if (new Set(types).size !== types.length) {
      return 'Each piece type can only appear once.';
    }
    return undefined;
  }
}
