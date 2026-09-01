import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { asList, versionLabel } from '../../shared/database-helpers';
import { MaterialApiService, WeaponApiService } from '../../../../../../api';

@Component({
  selector: 'app-database-weapon-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [RouterModule, LoaderComponent, TranslatePipe, MaterialIconDirective],
})
export class DatabaseWeaponDetailComponent {
  private readonly _weaponApi = inject(WeaponApiService);
  private readonly _materialApi = inject(MaterialApiService);
  private readonly _route = inject(ActivatedRoute);

  weapon = signal<any | null>(null);
  refinements = signal<any[]>([]);
  ascensions = signal<any[]>([]);
  loading = signal(true);

  /** Which refinement level the description below the row is showing. */
  selectedRefinement = signal(0);

  versionLabel = versionLabel;

  effects = computed(() => asList(this.weapon()?.effects));
  howToObtain = computed(() => asList(this.weapon()?.how_to_obtain));
  rarityStars = computed(() => '★'.repeat(Number(this.weapon()?.rarity ?? 0)));
  refinement = computed(() => this.refinements()[this.selectedRefinement()]);

  constructor() {
    this._route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.loading.set(true);
          if (!id) {
            return of(null);
          }
          // The costs name a material by id only, so the material list comes
          // along to give each one a name and an icon.
          return forkJoin({
            full: this._weaponApi.getWeaponFull(Number(id)),
            materials: this._materialApi.getMaterials(),
          });
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.loading.set(false);
            return;
          }
          const materialsById = new Map(result.materials.map((material) => [material.id, material]));
          const withMaterial = (row: any) => ({ ...row, material: materialsById.get(row.material_id) ?? null });

          this.weapon.set(result.full.weapon ?? null);
          this.refinements.set((result.full.refinements ?? []).map(withMaterial));
          this.ascensions.set(
            (result.full.ascensions ?? []).map((ascension: any) => ({
              ...ascension,
              costs: (ascension.costs ?? []).map(withMaterial),
            })),
          );
          this.selectedRefinement.set(0);
          this.loading.set(false);
        },
        error: () => {
          this.weapon.set(null);
          this.loading.set(false);
        },
      });
  }
}
