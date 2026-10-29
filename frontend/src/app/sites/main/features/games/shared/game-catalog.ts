import { ROUTE_MAP } from '../../../../../shared/routing-definition';

export type GameId = 'tournament' | 'minesweeper' | 'recipes' | 'pexeso';

/** How a game introduces itself on the Games page. */
export interface GameCard {
  readonly id: GameId;
  readonly path: string;
  readonly title: string;
  readonly info: string;
  readonly image: string;
}

/**
 * The four games, in the same shape as the quiz catalog so they can be drawn by
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
    image: 'assets/character/wish_icon/KLEE.avif',
  },
  {
    id: 'minesweeper',
    path: ROUTE_MAP.map['games'].minesweeper.path,
    title: 'game.minesweeper.title',
    info: 'game.minesweeper.info',
    image: 'assets/character/wish_icon/CITLALI.avif',
  },
  {
    // Yaoyao and her basket of vegetables, for the game of what goes into a dish.
    id: 'recipes',
    path: ROUTE_MAP.map['games'].recipes.path,
    title: 'game.recipes.title',
    info: 'game.recipes.info',
    image: 'assets/character/wish_icon/YAOYAO.avif',
  },
  {
    // The stage magician, for the game of cards.
    id: 'pexeso',
    path: ROUTE_MAP.map['games'].pexeso.path,
    title: 'game.pexeso.title',
    info: 'game.pexeso.info',
    image: 'assets/character/wish_icon/LYNEY.avif',
  },
];
