import { Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HomeComponent } from './home/home.component';
import { ROUTE_MAP } from '../../shared/routing-definition';
import { QuizzesComponent } from './features/quizzes/quizzes.component';
import { QuizzesBannersComponent } from './features/quizzes/banners/banners.component';
import { QuizzesDishComponent } from './features/quizzes/dish/dish.component';
import { QuizzesMismatchComponent } from './features/quizzes/mismatch/mismatch.component';
import { QuizzesMusicComponent } from './features/quizzes/music/music.component';
import { QuizzesPixelateComponent } from './features/quizzes/pixelate/pixelate.component';
import { QuizzesVoiceComponent } from './features/quizzes/voice/voice.component';
import { AppComponent } from './app.component';
import { DailyComponent } from './features/daily/daily.component';
import { GamesComponent } from './features/games/games.component';
import { GamesMinesweeperComponent } from './features/games/minesweeper/minesweeper.component';
import { GamesTournamentComponent } from './features/games/tournament/tournament.component';
import { DatabaseComponent } from './features/database/database.component';
import { DatabaseBannersComponent } from './features/database/banners/banners.component';
import { DatabaseCharactersComponent } from './features/database/characters/characters.component';
import { DatabaseMaterialsComponent } from './features/database/materials/materials.component';
import { DatabaseWeaponsComponent } from './features/database/weapons/weapons.component';
import { DatabaseCharacterDetailComponent } from './features/database/characters/detail/detail.component';
import { DatabaseMaterialDetailComponent } from './features/database/materials/detail/detail.component';
import { DatabaseWeaponDetailComponent } from './features/database/weapons/detail/detail.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ConfirmEmailComponent } from './features/account/confirm-email/confirm-email.component';
import { ResetPasswordComponent } from './features/account/reset-password/reset-password.component';
import { StaffSignInPageComponent } from './features/account/staff/staff.component';
import { routeAccessGuard } from './route-access.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', component: HomeComponent, canMatch: [routeAccessGuard] },
      // The daily run is the same six quizzes, told through the route data that
      // they are today's question rather than a fresh one. That flag is what
      // sends their saved game to the daily slot and stamps it with the date.
      {
        path: ROUTE_MAP.map['daily'].path,
        canMatch: [routeAccessGuard],
        children: [
          { path: '', component: DailyComponent },
          { path: ROUTE_MAP.map['daily'].banners.path, component: QuizzesBannersComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].dish.path, component: QuizzesDishComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].mismatch.path, component: QuizzesMismatchComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].music.path, component: QuizzesMusicComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].pixelate.path, component: QuizzesPixelateComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].voice.path, component: QuizzesVoiceComponent, data: { daily: true } },
        ],
      },
      {
        path: ROUTE_MAP.map['quizzes'].path,
        canMatch: [routeAccessGuard],
        children: [
          { path: '', component: QuizzesComponent },
          {
            path: ROUTE_MAP.map['quizzes'].banners.path,
            component: QuizzesBannersComponent,
          },
          {
            path: ROUTE_MAP.map['quizzes'].dish.path,
            component: QuizzesDishComponent,
          },
          {
            path: ROUTE_MAP.map['quizzes'].mismatch.path,
            component: QuizzesMismatchComponent,
          },
          {
            path: ROUTE_MAP.map['quizzes'].music.path,
            component: QuizzesMusicComponent,
          },
          {
            path: ROUTE_MAP.map['quizzes'].pixelate.path,
            component: QuizzesPixelateComponent,
          },
          {
            path: ROUTE_MAP.map['quizzes'].voice.path,
            component: QuizzesVoiceComponent,
          },
        ],
      },
      {
        path: ROUTE_MAP.map['games'].path,
        canMatch: [routeAccessGuard],
        children: [
          { path: '', component: GamesComponent },
          { path: ROUTE_MAP.map['games'].tournament.path, component: GamesTournamentComponent },
          { path: ROUTE_MAP.map['games'].minesweeper.path, component: GamesMinesweeperComponent },
        ],
      },
      {
        path: ROUTE_MAP.map['database'].path,
        canMatch: [routeAccessGuard],
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
      // No auth guard: the page is reachable from the header whether or not
      // anybody is signed in, and it says so itself rather than bouncing a
      // visitor to a login they may not want. The guard below is the route
      // table, which is a different question - and which is where somebody
      // would set this page to "anybody with an account" if they wanted that.
      {
        path: ROUTE_MAP.map['profile'].path,
        component: ProfileComponent,
        canMatch: [routeAccessGuard],
      },

      // Arrived at from a mail client, token in the query string. Both read it
      // once and drop it out of the address bar.
      { path: ROUTE_MAP.map['confirmEmail'].path, component: ConfirmEmailComponent },
      { path: ROUTE_MAP.map['resetPassword'].path, component: ResetPasswordComponent },

      // Never switchable: it is where the sign-in button goes when there is
      // no sign-in button.
      { path: ROUTE_MAP.map['staff'].path, component: StaffSignInPageComponent },
      { path: '**', component: NotFoundComponent },
    ],
  },
];
