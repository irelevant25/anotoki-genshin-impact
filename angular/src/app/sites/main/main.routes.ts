import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HomeComponent } from './home/home.component';
import { ROUTE_MAP } from '../../shared/routing-definition';
import { QuizzesComponent } from './features/quizzes/quizzes.component';
import { QuizzesBannersComponent } from './features/quizzes/banners/banners.component';
import { AppComponent } from './app.component';
import { DatabaseComponent } from './features/database/database.component';
import { DatabaseBannersComponent } from './features/database/banners/banners.component';
import { DatabaseCharactersComponent } from './features/database/characters/characters.component';
import { DatabaseMaterialsComponent } from './features/database/materials/materials.component';
import { DatabaseWeaponsComponent } from './features/database/weapons/weapons.component';
import { DatabaseCharacterDetailComponent } from './features/database/characters/detail/detail.component';
import { DatabaseMaterialDetailComponent } from './features/database/materials/detail/detail.component';
import { DatabaseWeaponDetailComponent } from './features/database/weapons/detail/detail.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', component: HomeComponent },
      {
        path: ROUTE_MAP.map['quizzes'].path,
        children: [
          { path: '', component: QuizzesComponent },
          {
            path: ROUTE_MAP.map['quizzes'].banners.path,
            component: QuizzesBannersComponent,
          },
        ],
      },
      {
        path: ROUTE_MAP.map['database'].path,
        children: [
          { path: '', component: DatabaseComponent },
          {
            path: ROUTE_MAP.map['database'].banners.path,
            component: DatabaseBannersComponent,
          },
          {
            path: ROUTE_MAP.map['database'].characters.path,
            children: [
              { path: '', component: DatabaseCharactersComponent },
              { path: ':id', component: DatabaseCharacterDetailComponent },
            ],
          },
          {
            path: ROUTE_MAP.map['database'].materials.path,
            children: [
              { path: '', component: DatabaseMaterialsComponent },
              { path: ':id', component: DatabaseMaterialDetailComponent },
            ],
          },
          {
            path: ROUTE_MAP.map['database'].weapons.path,
            children: [
              { path: '', component: DatabaseWeaponsComponent },
              { path: ':id', component: DatabaseWeaponDetailComponent },
            ],
          },
        ],
      },
      { path: '**', component: NotFoundComponent },
    ],
  },
];
