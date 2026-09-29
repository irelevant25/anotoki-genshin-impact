import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { GAME_CATALOG } from './shared/game-catalog';
import { GuideIconComponent } from '../../common/guide/guide-icon.component';

/**
 * The two games, on the same cards the Quizzes page uses.
 *
 * Nothing is marked here the way the Daily page marks a quiz - a game has no
 * result to report and nothing saved between visits.
 */
@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.scss'],
  imports: [RouterModule, TranslatePipe, GuideIconComponent],
})
export class GamesComponent {
  readonly GAMES = GAME_CATALOG;
}
