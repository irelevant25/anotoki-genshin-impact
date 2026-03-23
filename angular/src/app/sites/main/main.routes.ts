import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HomeComponent } from './home/home.component';
import { ROUTE_MAP } from '../../shared/routing-definition';
import { QuizzesComponent } from './top/quizzes/quizzes.component';
import { QuizzesBannersComponent } from './top/quizzes/banners/banners.component';
import { AppComponent } from './app.component';

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
      { path: '**', component: NotFoundComponent },
    ],
  },
];
