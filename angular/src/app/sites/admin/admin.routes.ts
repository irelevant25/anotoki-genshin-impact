import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
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
import { MigrationsListComponent } from './migrations/migrations-list/migrations-list.component';
import { FilesManagerComponent } from './files/files-manager/files-manager.component';
import { BannersListComponent } from './banners/banners-list/banners-list.component';
import { BannerFormComponent } from './banners/banner-form/banner-form.component';
import { BackgroundsListComponent } from './backgrounds/backgrounds-list/backgrounds-list.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { BackupsComponent } from './backups/backups.component';
import { UsersComponent } from './users/users.component';
import { LanguagesComponent } from './localization/languages/languages.component';
import { TranslationsComponent } from './localization/translations/translations.component';
import {
  ArtifactPieceTypesPage,
  CharacterStatesPage,
  DomainLevelsPage,
  ElementsPage,
  EnemyFamiliesPage,
  EnemyGroupsPage,
  EnemyTypesPage,
  FoodTypesPage,
  MaterialGroupsPage,
  MaterialTypesPage,
  RaritiesPage,
  RegionsPage,
  RelationshipTypesPage,
  RolesPage,
  StatsPage,
  TalentTypesPage,
  VoiceOverTypesPage,
  WeaponTypesPage,
} from './pages/pages';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', component: DashboardComponent },

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
      { path: 'elements',             component: ElementsPage },
      { path: 'weapon-types',         component: WeaponTypesPage },
      { path: 'voice-over-types',     component: VoiceOverTypesPage },
      { path: 'character-states',     component: CharacterStatesPage },
      { path: 'rarities',             component: RaritiesPage },
      { path: 'artifact-piece-types', component: ArtifactPieceTypesPage },
      // Banners
      { path: 'banners', component: BannersListComponent },
      { path: 'banners/create', component: BannerFormComponent },
      { path: 'banners/:id/edit', component: BannerFormComponent },

      // Localization - the site's own text, not game content
      { path: 'languages',            component: LanguagesComponent },
      { path: 'translations',         component: TranslationsComponent },

      { path: 'backgrounds',          component: BackgroundsListComponent },
      { path: 'feedback',             component: FeedbackComponent },
      { path: 'audit-logs',           component: AuditLogsComponent },
      { path: 'files',                component: FilesManagerComponent },
      { path: 'migrations',           component: MigrationsListComponent },
      { path: 'backups',              component: BackupsComponent },
      { path: 'accounts',             component: UsersComponent },

      // Writable lookup tables
      { path: 'relationship-types',   component: RelationshipTypesPage },
      { path: 'talent-types',         component: TalentTypesPage },
      { path: 'food-types',           component: FoodTypesPage },
      { path: 'material-types',       component: MaterialTypesPage },
      { path: 'material-groups',      component: MaterialGroupsPage },
      { path: 'regions',              component: RegionsPage },
      { path: 'roles',                component: RolesPage },
      { path: 'enemy-types',          component: EnemyTypesPage },
      { path: 'domain-levels',        component: DomainLevelsPage },
      { path: 'enemy-families',       component: EnemyFamiliesPage },
      { path: 'enemy-groups',         component: EnemyGroupsPage },
      { path: 'stats',                component: StatsPage },

      { path: '**', component: NotFoundComponent },
    ],
  },
];
