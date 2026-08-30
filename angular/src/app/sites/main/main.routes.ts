import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HomeComponent } from './home/home.component';
import { ROUTE_MAP } from '../../shared/routing-definition';
import { QuizzesComponent } from './features/quizzes/quizzes.component';
import { QuizzesBannersComponent } from './features/quizzes/banners/banners.component';
import { AppComponent } from './app.component';
import { DatabaseComponent } from './features/database/database.component';
import { DatabaseBannersComponent } from './features/database/banners/banners.component';

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
        ],
      },
      { path: '**', component: NotFoundComponent },
    ],
  },
];
