import { Routes } from '@angular/router';
import { MigrationsPageComponent } from '@anotoki/lib/migrations/page';
import { anotokiUnsavedChangesGuard } from '@anotoki/lib/translations';
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
import { BannersListComponent } from './banners/banners-list/banners-list.component';
import { BannerFormComponent } from './banners/banner-form/banner-form.component';
import { BackgroundsListComponent } from './backgrounds/backgrounds-list/backgrounds-list.component';
import { FileCategoriesComponent } from './file-categories/file-categories.component';
import { GuidesComponent } from './localization/guides/guides.component';
import { QuizLevelsComponent } from './quiz-levels/quiz-levels.component';
import { lookupRoute } from './pages/pages';
import { provideAdminPeople } from './people';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    // The library's People page, configured for this panel (people.ts) - with
    // the panel, never in the first load. (The admin tools' configuration is
    // the app's: shared/site-admin-tools.ts.)
    providers: [provideAdminPeople()],
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

      // Localization - the site's own text, not game content. The languages
      // and the strings are the anotoki library's pages
      // (@anotoki/lib/translations/admin, configured in shared/site-translations.ts),
      // each loaded when opened; leaving one with changes not saved asks first.
      // The guides behind the question marks are the site's own page.
      {
        path: 'languages',
        canDeactivate: [anotokiUnsavedChangesGuard],
        loadComponent: () => import('@anotoki/lib/translations/admin').then((m) => m.LanguagesPageComponent),
      },
      {
        path: 'translations',
        canDeactivate: [anotokiUnsavedChangesGuard],
        loadComponent: () => import('@anotoki/lib/translations/admin').then((m) => m.TranslationsPageComponent),
      },
      { path: 'guides', component: GuidesComponent },

      // What each level of each quiz shows, as data (users/061); leaving it with
      // changes not saved asks first, as the words' pages do.
      { path: 'quiz-levels', component: QuizLevelsComponent, canDeactivate: [anotokiUnsavedChangesGuard] },

      { path: 'backgrounds', component: BackgroundsListComponent },
      { path: 'files', component: FilesManagerComponent },
      { path: 'file-categories', component: FileCategoriesComponent },
      // The anotoki sites' one Migrations page (@anotoki/lib/migrations/page), for
      // this site's ADMIN: what has run, what waits, and Apply. While an update waits
      // it is the one page of the site that still opens - for an ADMIN. Its own entry
      // point, so it lands in this lazy chunk and never in the first load.
      { path: 'migrations', component: MigrationsPageComponent },
      // The site settings (@anotoki/lib/admin/site-settings, anotoki-lib 0.11.0 - genshin's own page made the
      // family's): Getting in, the Announcement and Page access, each a card opening its dialog - for this site's
      // ADMIN alone. Loaded when opened.
      {
        path: 'site-settings',
        loadComponent: () => import('@anotoki/lib/admin/site-settings').then((m) => m.SiteSettingsPageComponent),
      },

      // The anotoki library's admin tools (@anotoki/lib/admin/*, shared/site-admin-tools.ts)
      // and its People page (people.ts), at the addresses this panel's own pages had: for this
      // site's ADMIN alone - anybody else is told whose a page is. Each loaded when
      // opened, from an entry point of its own.
      { path: 'feedback', loadComponent: () => import('@anotoki/lib/admin/feedback').then((m) => m.FeedbackPageComponent) },
      { path: 'audit-logs', loadComponent: () => import('@anotoki/lib/admin/audit').then((m) => m.AuditLogPageComponent) },
      { path: 'errors', loadComponent: () => import('@anotoki/lib/admin/errors').then((m) => m.ErrorLogPageComponent) },
      { path: 'files-explorer', loadComponent: () => import('@anotoki/lib/admin/files').then((m) => m.FilesPageComponent) },
      { path: 'backups', loadComponent: () => import('@anotoki/lib/admin/backups').then((m) => m.BackupsPageComponent) },
      { path: 'people', loadComponent: () => import('@anotoki/lib/people/page').then((m) => m.PeoplePageComponent) },

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
