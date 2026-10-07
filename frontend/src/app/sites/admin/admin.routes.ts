import { Routes } from '@angular/router';
import { MigrationsPageComponent } from '@anotoki/lib/migrations';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { AppComponent } from './app.component';
import { CharactersListComponent } from './characters/characters-list/characters-list.component';
import { CharacterFormComponent } from './characters/character-form/character-form.component';
import { EnemiesListComponent } from './enemies/enemies-list/enemies-list.component';
import { EnemyFormComponent } from './enemies/enemy-form/enemy-form.component';
import { MaterialsListComponent } from './materials/materials-list/materials-list.component';
import { MaterialFormComponent } from './materials/material-form/material-form.component';
import { ArtifactsListComponent } from './artifacts/artifacts-list/artifacts-list.component';
import { ArtifactFormComponent } from './artifacts/artifact-form/artifact-form.component';
import { WeaponsListComponent } from './weapons/weapons-list/weapons-list.component';
import { WeaponFormComponent } from './weapons/weapon-form/weapon-form.component';
import { FoodsListComponent } from './foods/foods-list/foods-list.component';
import { FoodFormComponent } from './foods/food-form/food-form.component';
import { FilesManagerComponent } from './files/files-manager/files-manager.component';
import { FilesExplorerComponent } from './files-explorer/files-explorer.component';
import { BannersListComponent } from './banners/banners-list/banners-list.component';
import { BannerFormComponent } from './banners/banner-form/banner-form.component';
import { BackgroundsListComponent } from './backgrounds/backgrounds-list/backgrounds-list.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { ErrorsComponent } from './errors/errors.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { BackupsComponent } from './backups/backups.component';
import { SettingsComponent } from './settings/settings.component';
import { FileCategoriesComponent } from './file-categories/file-categories.component';
import { LanguagesComponent } from './localization/languages/languages.component';
import { TranslationsComponent } from './localization/translations/translations.component';
import { lookupRoute } from './pages/pages';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'dashboard', component: DashboardComponent },

      // Characters
      { path: 'characters', component: CharactersListComponent },
      { path: 'characters/create', component: CharacterFormComponent },
      { path: 'characters/:id/edit', component: CharacterFormComponent },

      // Enemies
      { path: 'enemies', component: EnemiesListComponent },
      { path: 'enemies/create', component: EnemyFormComponent },
      { path: 'enemies/:id/edit', component: EnemyFormComponent },

      // Materials
      { path: 'materials', component: MaterialsListComponent },
      { path: 'materials/create', component: MaterialFormComponent },
      { path: 'materials/:id/edit', component: MaterialFormComponent },

      // Artifacts
      { path: 'artifacts', component: ArtifactsListComponent },
      { path: 'artifacts/create', component: ArtifactFormComponent },
      { path: 'artifacts/:id/edit', component: ArtifactFormComponent },

      // Weapons
      { path: 'weapons', component: WeaponsListComponent },
      { path: 'weapons/create', component: WeaponFormComponent },
      { path: 'weapons/:id/edit', component: WeaponFormComponent },

      // Foods
      { path: 'foods', component: FoodsListComponent },
      { path: 'foods/create', component: FoodFormComponent },
      { path: 'foods/:id/edit', component: FoodFormComponent },

      // Read-only lookup tables
      lookupRoute('elements'),
      lookupRoute('weapon-types'),
      lookupRoute('character-states'),
      lookupRoute('rarities'),
      lookupRoute('artifact-piece-types'),
      // Banners
      { path: 'banners', component: BannersListComponent },
      { path: 'banners/create', component: BannerFormComponent },
      { path: 'banners/:id/edit', component: BannerFormComponent },

      // Localization - the site's own text, not game content
      { path: 'languages', component: LanguagesComponent },
      { path: 'translations', component: TranslationsComponent },

      { path: 'backgrounds', component: BackgroundsListComponent },
      { path: 'feedback', component: FeedbackComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'errors', component: ErrorsComponent },
      { path: 'files', component: FilesManagerComponent },
      { path: 'files-explorer', component: FilesExplorerComponent },
      { path: 'file-categories', component: FileCategoriesComponent },
      // The anotoki sites' one Migrations page (@anotoki/lib/migrations), for this
      // site's ADMIN: what has run, what waits, and Apply. While an update waits it
      // is the one page of the site that still opens - for an ADMIN.
      { path: 'migrations', component: MigrationsPageComponent },
      { path: 'backups', component: BackupsComponent },
      { path: 'settings', component: SettingsComponent },

      // Writable lookup tables
      lookupRoute('relationship-types'),
      lookupRoute('talent-types'),
      lookupRoute('food-types'),
      lookupRoute('material-types'),
      lookupRoute('material-groups'),
      lookupRoute('regions'),
      lookupRoute('roles'),
      lookupRoute('enemy-types'),
      lookupRoute('domain-levels'),
      lookupRoute('enemy-families'),
      lookupRoute('enemy-groups'),
      lookupRoute('stats'),

      { path: '**', component: NotFoundComponent },
    ],
  },
];
