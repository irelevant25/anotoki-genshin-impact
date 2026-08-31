import { ROUTE_MAP } from '../../../../../shared/routing-definition';

export type GameId = 'tournament' | 'minesweeper';

/** How a game introduces itself on the Games page. */
export interface GameCard {
  readonly id: GameId;
  readonly path: string;
  readonly title: string;
  readonly info: string;
  readonly about: string;
  readonly image: string;
}

/**
 * The two games, in the same shape as the quiz catalog so they can be drawn by
 * the same card.
 *
 * Unlike a quiz, a game keeps nothing: no saved position, no result, no
 * history. You play it, and when you leave it is gone. That is why nothing here
 * refers to a quiz id or a progress slot.
 */
export const GAME_CATALOG: readonly GameCard[] = [
  {
    id: 'tournament',
    path: ROUTE_MAP.map['games'].tournament.path,
    title: 'game.tournament.title',
    info: 'game.tournament.info',
    about: 'game.tournament.about',
    image: 'assets/character/wish_icon/Klee.avif',
  },
  {
    id: 'minesweeper',
    path: ROUTE_MAP.map['games'].minesweeper.path,
    title: 'game.minesweeper.title',
    info: 'game.minesweeper.info',
    about: 'game.minesweeper.about',
    image: 'assets/character/wish_icon/Citlali.avif',
  },
];
