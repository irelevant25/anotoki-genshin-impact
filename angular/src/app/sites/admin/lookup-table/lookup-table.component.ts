import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminApiService } from '../services/admin-api.service';
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

  private readonly _api = inject(AdminApiService);
  private readonly _notify = inject(NotificationService);

  private get _pkField(): string {
    return this.config().pkField ?? 'name';
  }

  private get _listFn(): () => Observable<any[]> {
    const key = this.config().apiKey;
    const map: Record<string, () => Observable<any[]>> = {
      elements: () => this._api.getElements(),
      'weapon-types': () => this._api.getWeaponTypes(),
      'voice-over-types': () => this._api.getVoiceOverTypes(),
      'character-states': () => this._api.getCharacterStates(),
      languages: () => this._api.getLanguages(),
      rarities: () => this._api.getRarities(),
      'artifact-piece-types': () => this._api.getArtifactPieceTypes(),
      migrations: () => this._api.getMigrations(),
      stats: () => this._api.getStats(),
      'relationship-types': () => this._api.getRelationshipTypes(),
      'talent-types': () => this._api.getTalentTypes(),
      'food-types': () => this._api.getFoodTypes(),
      'material-types': () => this._api.getMaterialTypes(),
      'material-groups': () => this._api.getMaterialGroups(),
      regions: () => this._api.getRegions(),
      roles: () => this._api.getRoles(),
      'enemy-types': () => this._api.getEnemyTypes(),
      'domain-levels': () => this._api.getDomainLevels(),
      'enemy-families': () => this._api.getEnemyFamilies(),
      'enemy-groups': () => this._api.getEnemyGroups(),
    };
    return map[key] ?? (() => this._api.getElements());
  }

  get _createFn(): ((name: string) => Observable<any>) | null {
    const key = this.config().apiKey;
    const map: Record<string, (name: string) => Observable<any>> = {
      'relationship-types': (n) => this._api.createRelationshipType(n),
      'talent-types': (n) => this._api.createTalentType(n),
      'food-types': (n) => this._api.createFoodType(n),
      'material-types': (n) => this._api.createMaterialType(n),
      'material-groups': (n) => this._api.createMaterialGroup(n),
      regions: (n) => this._api.createRegion(n),
      roles: (n) => this._api.createRole(n),
      'enemy-types': (n) => this._api.createEnemyType(n),
      'domain-levels': (n) => this._api.createDomainLevel(n),
      'enemy-families': (n) => this._api.createEnemyFamily(n),
      'enemy-groups': (n) => this._api.createEnemyGroup(n),
      stats: (n) => this._api.createStat(n),
    };
    return map[key] ?? null;
  }

  get _deleteFn(): ((name: string) => Observable<any>) | null {
    const key = this.config().apiKey;
    const map: Record<string, (name: string) => Observable<any>> = {
      'relationship-types': (n) => this._api.deleteRelationshipType(n),
      'talent-types': (n) => this._api.deleteTalentType(n),
      'food-types': (n) => this._api.deleteFoodType(n),
      'material-types': (n) => this._api.deleteMaterialType(n),
      'material-groups': (n) => this._api.deleteMaterialGroup(n),
      regions: (n) => this._api.deleteRegion(n),
      roles: (n) => this._api.deleteRole(n),
      'enemy-types': (n) => this._api.deleteEnemyType(n),
      'domain-levels': (n) => this._api.deleteDomainLevel(n),
      'enemy-families': (n) => this._api.deleteEnemyFamily(n),
      'enemy-groups': (n) => this._api.deleteEnemyGroup(n),
      stats: (id) => this._api.deleteStat(Number(id)),
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
