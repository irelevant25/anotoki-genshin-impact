import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { RouterLink } from '@angular/router';
import { CharacterApiService } from '../../../../api';
import { ConfirmService } from '@anotoki/lib/ui/dialog';
import { ToastService } from '@anotoki/lib/ui/toast';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { SelectComponent, SelectOption, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { MultiselectComponent } from '@anotoki/lib/ui/multiselect';
import { AnotokiDatePipe } from '@anotoki/lib/ui/dates';
import { matchesSearch } from '@anotoki/lib/ui/search';
import { multiselectOptions } from '../../shared/admin-list.class';

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
  imports: [PageHeaderComponent, SpinnerComponent, TooltipDirective, AnotokiDatePipe, RouterLink, ButtonComponent, TextFieldComponent, SelectComponent, MultiselectComponent],
})
export class CharactersListComponent implements OnInit {
  characters = signal<any[]>([]);
  loading = signal(false);

  // ── Filters ─────────────────────────────────────────────────────────────────
  filterId = signal('');
  filterName = signal('');
  filterElements = signal<readonly string[]>([]);
  filterWeapons = signal<readonly string[]>([]);
  /** A rarity as the select holds it, '' for any. */
  filterRarity = signal('');
  filterRegions = signal<readonly string[]>([]);
  filterVersions = signal<readonly string[]>([]);

  /** Options come from the loaded rows, so they always match what is filterable. */
  elementOptions = computed(() => multiselectOptions(this._distinct('element')));
  weaponOptions = computed(() => multiselectOptions(this._distinct('weapon_type')));
  regionOptions = computed(() => multiselectOptions(this._distinct('region')));
  rarityOptions = computed(() => this._distinct('rarity').sort().reverse());
  rarityChoices = computed<SelectOption[]>(() => this.rarityOptions().map((rarity) => ({ value: rarity, label: `${rarity} ★` })));
  versionOptions = computed(() => multiselectOptions(this._distinct('version').sort(compareVersionsDesc)));

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
      if (name && !matchesSearch(String(character.name ?? ''), name)) {
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
      (this.filterRarity() !== undefined && this.filterRarity() !== null && this.filterRarity() !== ''),
  );

  private readonly _characterApi = inject(CharacterApiService);
  private readonly _notify = inject(ToastService);
  private readonly _confirm = inject(ConfirmService);

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
        this._notify.error('Failed to load characters');
      },
    });
  }

  resetFilters(): void {
    this.filterId.set('');
    this.filterName.set('');
    this.filterElements.set([]);
    this.filterWeapons.set([]);
    this.filterRarity.set('');
    this.filterRegions.set([]);
    this.filterVersions.set([]);
  }

  /** Asks first (the kit's question, its focus on No), then deletes. */
  async confirmDelete(id: number, name?: string | null): Promise<void> {
    if (await this._confirm.ask({ title: `Delete ${name || `#${id}`}?`, confirmLabel: 'Delete', tone: 'danger' })) {
      this.delete(id);
    }
  }

  delete(id: number): void {
    this._characterApi.deleteCharacter(id).subscribe({
      next: () => {
        this.load();
        this._notify.success('Character deleted');
      },
      error: (e) => {
        this._notify.error(e?.error?.error ?? e?.error?.message ?? 'Failed to delete');
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

  private _selected(value: readonly unknown[] | null | undefined): string[] {
    return (value ?? []).map((entry) => String(entry));
  }
}
