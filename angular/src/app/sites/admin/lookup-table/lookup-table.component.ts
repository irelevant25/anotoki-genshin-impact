import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { LookupApiService, StatApiService } from '../../../api';
import { NotificationService } from '../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../shared/local-lib/components/loader/loader.component';

export interface LookupTableConfig {
  title: string;
  apiKey: string;
  readOnly?: boolean;
  pkField?: string;
  extraColumns?: { label: string; field: string }[];
}

@Component({
  selector: 'app-lookup-table',
  templateUrl: './lookup-table.component.html',
  styleUrls: ['./lookup-table.component.scss'],
  imports: [CommonModule, FormsModule, ButtonComponent, LoaderComponent],
})
export class LookupTableComponent implements OnInit {
  config = input.required<LookupTableConfig>();

  items = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  newName = signal('');
  deleteConfirm = signal<string | null>(null);

  private readonly _lookupApi = inject(LookupApiService);
  private readonly _statApi = inject(StatApiService);
  private readonly _notify = inject(NotificationService);

  private get _pkField(): string {
    return this.config().pkField ?? 'name';
  }

  private get _listFn(): () => Observable<any[]> {
    const key = this.config().apiKey;
    const map: Record<string, () => Observable<any[]>> = {
      elements: () => this._lookupApi.getElements(),
      'weapon-types': () => this._lookupApi.getWeaponTypes(),
      'voice-over-types': () => this._lookupApi.getVoiceOverTypes(),
      'character-states': () => this._lookupApi.getCharacterStates(),
      rarities: () => this._lookupApi.getRarities(),
      'artifact-piece-types': () => this._lookupApi.getArtifactPieceTypes(),
      stats: () => this._statApi.getStats(),
      'relationship-types': () => this._lookupApi.getRelationshipTypes(),
      'talent-types': () => this._lookupApi.getTalentTypes(),
      'food-types': () => this._lookupApi.getFoodTypes(),
      'material-types': () => this._lookupApi.getMaterialTypes(),
      'material-groups': () => this._lookupApi.getMaterialGroups(),
      regions: () => this._lookupApi.getRegions(),
      roles: () => this._lookupApi.getRoles(),
      'enemy-types': () => this._lookupApi.getEnemyTypes(),
      'domain-levels': () => this._lookupApi.getDomainLevels(),
      'enemy-families': () => this._lookupApi.getEnemyFamilies(),
      'enemy-groups': () => this._lookupApi.getEnemyGroups(),
    };
    return map[key] ?? (() => this._lookupApi.getElements());
  }

  get _createFn(): ((name: string) => Observable<any>) | null {
    const key = this.config().apiKey;
    const map: Record<string, (name: string) => Observable<any>> = {
      'relationship-types': (n) => this._lookupApi.createRelationshipType({ name: n }),
      'talent-types': (n) => this._lookupApi.createTalentType({ name: n }),
      'food-types': (n) => this._lookupApi.createFoodType({ name: n }),
      'material-types': (n) => this._lookupApi.createMaterialType({ name: n }),
      'material-groups': (n) => this._lookupApi.createMaterialGroup({ name: n }),
      regions: (n) => this._lookupApi.createRegion({ name: n }),
      roles: (n) => this._lookupApi.createRole({ name: n }),
      'enemy-types': (n) => this._lookupApi.createEnemyType({ name: n }),
      'domain-levels': (n) => this._lookupApi.createDomainLevel({ name: n }),
      'enemy-families': (n) => this._lookupApi.createEnemyFamily({ name: n }),
      'enemy-groups': (n) => this._lookupApi.createEnemyGroup({ name: n }),
      stats: (n) => this._statApi.createStat({ name: n }),
    };
    return map[key] ?? null;
  }

  get _deleteFn(): ((name: string) => Observable<any>) | null {
    const key = this.config().apiKey;
    const map: Record<string, (name: string) => Observable<any>> = {
      'relationship-types': (n) => this._lookupApi.deleteRelationshipType(n),
      'talent-types': (n) => this._lookupApi.deleteTalentType(n),
      'food-types': (n) => this._lookupApi.deleteFoodType(n),
      'material-types': (n) => this._lookupApi.deleteMaterialType(n),
      'material-groups': (n) => this._lookupApi.deleteMaterialGroup(n),
      regions: (n) => this._lookupApi.deleteRegion(n),
      roles: (n) => this._lookupApi.deleteRole(n),
      'enemy-types': (n) => this._lookupApi.deleteEnemyType(n),
      'domain-levels': (n) => this._lookupApi.deleteDomainLevel(n),
      'enemy-families': (n) => this._lookupApi.deleteEnemyFamily(n),
      'enemy-groups': (n) => this._lookupApi.deleteEnemyGroup(n),
      stats: (id) => this._statApi.deleteStat(Number(id)),
    };
    return map[key] ?? null;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._listFn().subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this._notify.showError('Failed to load data'); },
    });
  }

  add(): void {
    const name = this.newName().trim();
    if (!name || !this._createFn) return;
    this.saving.set(true);
    this._createFn(name).subscribe({
      next: () => {
        this.newName.set('');
        this.saving.set(false);
        this.load();
        this._notify.showSuccess('Created successfully');
      },
      error: (e) => {
        this.saving.set(false);
        this._notify.showError(e?.error?.message ?? 'Failed to create');
      },
    });
  }

  confirmDelete(pk: string): void {
    this.deleteConfirm.set(pk);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  delete(pk: string): void {
    if (!this._deleteFn) return;
    this._deleteFn(pk).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.load();
        this._notify.showSuccess('Deleted successfully');
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this._notify.showError(e?.error?.message ?? 'Failed to delete');
      },
    });
  }

  getPk(item: any): string {
    return String(item[this._pkField] ?? item['id'] ?? item['rarity']);
  }

  getColumns(): string[] {
    const items = this.items();
    if (!items.length) return [];
    return Object.keys(items[0]).filter(k => !['created_at', 'updated_at', 'created_by', 'updated_by'].includes(k));
  }
}
