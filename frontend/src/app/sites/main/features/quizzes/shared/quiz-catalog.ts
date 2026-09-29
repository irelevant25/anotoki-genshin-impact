import { ROUTE_MAP } from '../../../../../shared/routing-definition';
import { QuizId } from './quiz.types';

/** How a quiz introduces itself on a card. */
export interface QuizCard {
  readonly id: QuizId;
  /** Path segment, the same under /quizzes and under /daily. */
  readonly path: string;
  readonly title: string;
  readonly info: string;
  readonly image: string;
}

/**
 * The six quizzes as the site presents them.
 *
 * Both the Quizzes page and the Daily page draw the same card, so the titles
 * and the faces on them live here rather than in whichever page was written
 * first. The keys are the quiz ids used everywhere else - for the saved game,
 * for the difficulty config, and by the server.
 */
export const QUIZ_CATALOG: readonly QuizCard[] = [
  {
    id: 'banners',
    path: ROUTE_MAP.map['quizzes'].banners.path,
    title: 'quiz.banners.title',
    info: 'quiz.banners.info',
    image: 'assets/character/wish_icon/VENTI.avif',
  },
  {
    id: 'pixelate',
    path: ROUTE_MAP.map['quizzes'].pixelate.path,
    title: 'quiz.pixelate.title',
    info: 'quiz.pixelate.info',
    image: 'assets/character/wish_icon/KINICH.avif',
  },
  {
    id: 'mismatch',
    path: ROUTE_MAP.map['quizzes'].mismatch.path,
    title: 'quiz.mismatch.title',
    info: 'quiz.mismatch.info',
    image: 'assets/character/wish_icon/ARLECCHINO.avif',
  },
  {
    id: 'music',
    path: ROUTE_MAP.map['quizzes'].music.path,
    title: 'quiz.music.title',
    info: 'quiz.music.info',
    image: 'assets/character/wish_icon/XINYAN.avif',
  },
  {
    id: 'dish',
    path: ROUTE_MAP.map['quizzes'].dish.path,
    title: 'quiz.dish.title',
    info: 'quiz.dish.info',
    image: 'assets/character/wish_icon/XIANGLING.avif',
  },
  {
    id: 'voice',
    path: ROUTE_MAP.map['quizzes'].voice.path,
    title: 'quiz.voice.title',
    info: 'quiz.voice.info',
    image: 'assets/character/wish_icon/YUN_JIN.avif',
  },
];

export function quizCard(id: QuizId): QuizCard | undefined {
  return QUIZ_CATALOG.find((card) => card.id === id);
}
