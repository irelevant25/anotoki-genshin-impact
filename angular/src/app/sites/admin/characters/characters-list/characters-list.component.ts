import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterApiService } from '../../../../api';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TextComponent } from '../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../shared/local-lib/components/dropdown/dropdown.component';
import { MultiselectComponent } from '../../../../shared/local-lib/components/multiselect/multiselect.component';
import { AppDatePipe } from '../../../../shared/local-lib/pipes/date.pipe';

/** Sorts version strings numerically ("1.10" after "1.9"), newest first. */
function compareVersionsDesc(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] ?? 0) - (left[i] ?? 0);
    if (diff) {
      return diff;
    }
  }
  return 0;
}

@Component({
  selector: 'app-characters-list',
  templateUrl: './characters-list.component.html',
  styleUrls: ['./characters-list.component.scss'],
  imports: [AppDatePipe, RouterLink, ButtonComponent, LoaderComponent, TextComponent, DropdownComponent, MultiselectComponent],
})
export class CharactersListComponent implements OnInit {
  characters = signal<any[]>([]);
  loading = signal(false);
  deleteConfirm = signal<number | null>(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  filterId = signal<string | number | null | undefined>('');
  filterName = signal<string | number | null | undefined>('');
  filterElements = signal<(string | number | boolean)[] | null | undefined>([]);
  filterWeapons = signal<(string | number | boolean)[] | null | undefined>([]);
  filterRarity = signal<string | number | boolean | null | undefined>(undefined);
  filterRegions = signal<(string | number | boolean)[] | null | undefined>([]);
  filterVersions = signal<(string | number | boolean)[] | null | undefined>([]);

  /** Options come from the loaded rows, so they always match what is filterable. */
  elementOptions = computed(() => this._distinct('element'));
  weaponOptions = computed(() => this._distinct('weapon_type'));
  regionOptions = computed(() => this._distinct('region'));
  rarityOptions = computed(() => this._distinct('rarity').sort().reverse());
  versionOptions = computed(() => this._distinct('version').sort(compareVersionsDesc));

  sortedCharacters = computed(() => [...this.characters()].sort((a, b) => compareVersionsDesc(a.version, b.version)));

  filteredCharacters = computed(() => {
    const id = String(this.filterId() ?? '').trim();
    const name = String(this.filterName() ?? '')
      .trim()
      .toLowerCase();
    const elements = this._selected(this.filterElements());
    const weapons = this._selected(this.filterWeapons());
    const regions = this._selected(this.filterRegions());
    const versions = this._selected(this.filterVersions());
    const rarity = this.filterRarity();

    return this.sortedCharacters().filter((character) => {
      if (id && !String(character.id).includes(id)) {
        return false;
      }
      if (name && !String(character.name ?? '').toLowerCase().includes(name)) {
        return false;
      }
      if (elements.length && !elements.includes(character.element)) {
        return false;
      }
      if (weapons.length && !weapons.includes(character.weapon_type)) {
        return false;
      }
      if (regions.length && !regions.includes(character.region)) {
        return false;
      }
      if (versions.length && !versions.includes(character.version)) {
        return false;
      }
      // Loose compare: the dropdown hands back the option key as a string.
      if (rarity !== undefined && rarity !== null && rarity !== '' && character.rarity != rarity) {
        return false;
      }
      return true;
    });
  });

  hasActiveFilter = computed(
    () =>
      !!String(this.filterId() ?? '').trim() ||
      !!String(this.filterName() ?? '').trim() ||
      this._selected(this.filterElements()).length > 0 ||
      this._selected(this.filterWeapons()).length > 0 ||
      this._selected(this.filterRegions()).length > 0 ||
      this._selected(this.filterVersions()).length > 0 ||
      (this.filterRarity() !== undefined && this.filterRarity() !== null && this.filterRarity() !== '')
  );

  private readonly _characterApi = inject(CharacterApiService);
  private readonly _notify = inject(NotificationService);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this._characterApi.getCharacters().subscribe({
      next: (data) => {
        this.characters.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this._notify.showError('Failed to load characters');
      },
    });
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterElements.set([]);
    this.filterWeapons.set([]);
    this.filterRarity.set(undefined);
    this.filterRegions.set([]);
    this.filterVersions.set([]);
  }

  confirmDelete(id: number): void {
    this.deleteConfirm.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  delete(id: number): void {
    this._characterApi.deleteCharacter(id).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.load();
        this._notify.showSuccess('Character deleted');
      },
      error: (e) => {
        this.deleteConfirm.set(null);
        this._notify.showError(e?.error?.error ?? e?.error?.message ?? 'Failed to delete');
      },
    });
  }

  getRarityStars(rarity: number): string {
    return '★'.repeat(rarity);
  }

  private _distinct(field: string): string[] {
    const values = this.characters()
      .map((character) => character[field])
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => String(value));
    return [...new Set(values)].sort();
  }

  private _selected(value: (string | number | boolean)[] | null | undefined): string[] {
    return (value ?? []).map((entry) => String(entry));
  }
}
