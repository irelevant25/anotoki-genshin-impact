import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthCallbackComponent } from '@anotoki/lib/auth';
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
import { QuizzesSplashComponent } from './features/quizzes/splash/splash.component';
import { QuizzesConstellationComponent } from './features/quizzes/constellation/constellation.component';
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
import { DatabaseArtifactsComponent } from './features/database/artifacts/artifacts.component';
import { DatabaseArtifactDetailComponent } from './features/database/artifacts/detail/detail.component';
import { DatabaseFoodsComponent } from './features/database/foods/foods.component';
import { DatabaseFoodDetailComponent } from './features/database/foods/detail/detail.component';
import { ProfileComponent } from './features/profile/profile.component';
import { StaffSignInPageComponent } from './features/account/staff/staff.component';
import { pageAccessGuard } from '@anotoki/lib/site-settings';

/** The legal pages' frame, loaded with the first of them that is opened (and the site's facts with it, out of the first load). */
const legalFrame = (): Promise<Type<unknown>> => import('./legal/legal-frame.component').then((m) => m.LegalFrameComponent);

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', component: HomeComponent, canMatch: [pageAccessGuard] },
      // The daily run is the same eight quizzes, told through the route data that
      // they are today's question rather than a fresh one. That flag is what
      // sends their saved game to the daily slot and stamps it with the date.
      {
        path: ROUTE_MAP.map['daily'].path,
        canMatch: [pageAccessGuard],
        children: [
          { path: '', component: DailyComponent },
          { path: ROUTE_MAP.map['daily'].banners.path, component: QuizzesBannersComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].dish.path, component: QuizzesDishComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].mismatch.path, component: QuizzesMismatchComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].music.path, component: QuizzesMusicComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].pixelate.path, component: QuizzesPixelateComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].voice.path, component: QuizzesVoiceComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].splash.path, component: QuizzesSplashComponent, data: { daily: true } },
          { path: ROUTE_MAP.map['daily'].constellation.path, component: QuizzesConstellationComponent, data: { daily: true } },
        ],
      },
      {
        path: ROUTE_MAP.map['quizzes'].path,
        canMatch: [pageAccessGuard],
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
          {
            path: ROUTE_MAP.map['quizzes'].splash.path,
            component: QuizzesSplashComponent,
          },
          {
            path: ROUTE_MAP.map['quizzes'].constellation.path,
            component: QuizzesConstellationComponent,
          },
        ],
      },
      {
        path: ROUTE_MAP.map['games'].path,
        canMatch: [pageAccessGuard],
        children: [
          { path: '', component: GamesComponent },
          { path: ROUTE_MAP.map['games'].tournament.path, component: GamesTournamentComponent },
          { path: ROUTE_MAP.map['games'].minesweeper.path, component: GamesMinesweeperComponent },
        ],
      },
      {
        path: ROUTE_MAP.map['database'].path,
        canMatch: [pageAccessGuard],
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
          {
            path: ROUTE_MAP.map['database'].artifacts.path,
            children: [
              { path: '', component: DatabaseArtifactsComponent },
              { path: ':id', component: DatabaseArtifactDetailComponent },
            ],
          },
          {
            path: ROUTE_MAP.map['database'].foods.path,
            children: [
              { path: '', component: DatabaseFoodsComponent },
              { path: ':id', component: DatabaseFoodDetailComponent },
            ],
          },
        ],
      },
      // No auth guard: the page is reachable from the header whether or not
      // anybody is signed in, and it says so itself rather than bouncing a
      // visitor to a login they may not want. The guard below is Page access
      // (the site settings, @anotoki/lib/site-settings), which is a different
      // question - and which is where somebody would set this page to
      // "anybody signed in" if they wanted that.
      {
        path: ROUTE_MAP.map['profile'].path,
        component: ProfileComponent,
        canMatch: [pageAccessGuard],
      },

      // Where the IAM hands a sign-in back: the library's page
      // (@anotoki/lib/auth). Never switchable, and normally never drawn - the
      // app initializer has finished the sign-in and moved on before the router
      // looks. What is left is a sign-in that did not work: the library's
      // screen says why (anotoki.signIn.*), with Try again and Back. A visit
      // with nothing to report goes home rather than to an empty page; search
      // engines are asked not to index it (and robots.txt keeps them off /auth/).
      {
        path: ROUTE_MAP.map['authCallback'].path,
        component: AuthCallbackComponent,
      },

      // Never switchable (a reserved page of the site settings): where an
      // administrator signs in - while the site is closed the library's closed
      // sign stands here with its Sign in, and while it is open this page does.
      { path: ROUTE_MAP.map['staff'].path, component: StaffSignInPageComponent },

      // The legal pages - Terms, Privacy, Contact: the anotoki family's
      // (@anotoki/lib/legal/pages) with genshin's facts, which their frame
      // gives them (legal/), each loaded when it is opened. Anybody's: no page
      // switch (no pageAccessGuard - the site settings refuse a row for them),
      // the root gate lets them through the closed sign, and the shell draws them
      // in place of its sign-in card. Each is
      // a path of its own with the frame as its parent - never one parent with
      // an empty path holding the three: the router takes an address it has
      // read whole for such a parent when none of its children match, and
      // would draw the empty frame where the home page should be (the survey's
      // lesson, 2026-10-17). Before "**", which would take them. Their paths
      // are the library's (DEFAULT_LEGAL_PATHS: shared/site-legal.ts, the
      // footer's links go there).
      //
      // The About and Support pages (anotoki-lib 0.8.0: @anotoki/lib/legal/about,
      // /legal/support - the same on every anotoki site, in the library's
      // words) are anybody's too, in the same frame, the same way; both footers
      // link them first.
      {
        path: 'about',
        loadComponent: legalFrame,
        children: [{ path: '', loadComponent: () => import('@anotoki/lib/legal/about').then((m) => m.AboutPageComponent) }],
      },
      {
        path: 'support',
        loadComponent: legalFrame,
        children: [{ path: '', loadComponent: () => import('@anotoki/lib/legal/support').then((m) => m.SupportPageComponent) }],
      },
      {
        path: 'terms',
        loadComponent: legalFrame,
        children: [{ path: '', loadComponent: () => import('@anotoki/lib/legal/pages').then((m) => m.TermsPageComponent) }],
      },
      {
        path: 'privacy',
        loadComponent: legalFrame,
        children: [{ path: '', loadComponent: () => import('@anotoki/lib/legal/pages').then((m) => m.PrivacyPageComponent) }],
      },
      {
        path: 'contact',
        loadComponent: legalFrame,
        children: [{ path: '', loadComponent: () => import('@anotoki/lib/legal/pages').then((m) => m.ContactPageComponent) }],
      },

      { path: '**', component: NotFoundComponent },
    ],
  },
];
