/**
 * The guides behind the question marks.
 *
 * Each one is two translations: a title, which is a sentence, and a body,
 * which is markup - a heading, some prose, a numbered list of how to play.
 * The body is flagged `is_html` on its key, so the admin panel opens it in the
 * HTML editor rather than a one-line box.
 *
 * The pairs are written out here rather than built from the id at the point of
 * use, because `php translations.php --status` finds keys by reading whole
 * quoted strings out of the source. A key assembled at runtime is a key
 * nothing can tell you is missing.
 */
export type GuideId =
  | 'daily'
  | 'quizzes'
  | 'games'
  | 'banners'
  | 'pixelate'
  | 'mismatch'
  | 'music'
  | 'dish'
  | 'voice'
  | 'tournament'
  | 'minesweeper';

export interface Guide {
  readonly id: GuideId;
  /** Plain text - the modal's heading. */
  readonly title: string;
  /** Markup - rendered by app-rich-text, never by the translate pipe. */
  readonly content: string;
}

export const GUIDES: Readonly<Record<GuideId, Guide>> = {
  daily: { id: 'daily', title: 'guide.daily.title', content: 'guide.daily.content' },
  quizzes: { id: 'quizzes', title: 'guide.quizzes.title', content: 'guide.quizzes.content' },
  games: { id: 'games', title: 'guide.games.title', content: 'guide.games.content' },

  banners: { id: 'banners', title: 'guide.banners.title', content: 'guide.banners.content' },
  pixelate: { id: 'pixelate', title: 'guide.pixelate.title', content: 'guide.pixelate.content' },
  mismatch: { id: 'mismatch', title: 'guide.mismatch.title', content: 'guide.mismatch.content' },
  music: { id: 'music', title: 'guide.music.title', content: 'guide.music.content' },
  dish: { id: 'dish', title: 'guide.dish.title', content: 'guide.dish.content' },
  voice: { id: 'voice', title: 'guide.voice.title', content: 'guide.voice.content' },

  tournament: { id: 'tournament', title: 'guide.tournament.title', content: 'guide.tournament.content' },
  minesweeper: { id: 'minesweeper', title: 'guide.minesweeper.title', content: 'guide.minesweeper.content' },
};
