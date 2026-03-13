import { Routes } from '@angular/router';
import { NotFoundComponent } from './sites/not-found/not-found.component';
import { HomeComponent } from './sites/home/home.component';
import { ROUTE_MAP } from './shared/routing-definition';
import { QuizzesComponent } from './sites/top/quizzes/quizzes.component';
import { QuizzesBannersComponent } from './sites/top/quizzes/banners/banners.component';

export const routes: Routes = [
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
  { path: '**', component: NotFoundComponent },
];
