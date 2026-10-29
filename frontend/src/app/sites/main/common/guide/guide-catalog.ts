/**
 * The guides behind the question marks.
 *
 * Each one is a title, which is a string like any other (`guide.<id>.title`,
 * through the translate pipe), and a body, which is markup - a heading, some
 * prose, a numbered list of how to play - and content of its own rather than a
 * string (the guide_contents table since users/050): the guide modal asks
 * GET /api/guides/{id} for it in the reader's language, and the admin panel's
 * Guides page edits it in the HTML editor.
 *
 * The titles are written out here rather than built from the id at the point
 * of use, because `php translations.php --status` finds keys by reading whole
 * quoted strings out of the source. A key assembled at runtime is a key
 * nothing can tell you is missing.
 */
export type GuideId = 'daily' | 'quizzes' | 'games' | 'banners' | 'pixelate' | 'mismatch' | 'music' | 'dish' | 'voice' | 'splash' | 'constellation' | 'tournament' | 'minesweeper';

export interface Guide {
  /** The guide's name, as GET /api/guides/{id} and guide_contents.guide know it. */
  readonly id: GuideId;
  /** Plain text - the modal's heading. */
  readonly title: string;
}

export const GUIDES: Readonly<Record<GuideId, Guide>> = {
  daily: { id: 'daily', title: 'guide.daily.title' },
  quizzes: { id: 'quizzes', title: 'guide.quizzes.title' },
  games: { id: 'games', title: 'guide.games.title' },

  banners: { id: 'banners', title: 'guide.banners.title' },
  pixelate: { id: 'pixelate', title: 'guide.pixelate.title' },
  mismatch: { id: 'mismatch', title: 'guide.mismatch.title' },
  music: { id: 'music', title: 'guide.music.title' },
  dish: { id: 'dish', title: 'guide.dish.title' },
  voice: { id: 'voice', title: 'guide.voice.title' },
  splash: { id: 'splash', title: 'guide.splash.title' },
  constellation: { id: 'constellation', title: 'guide.constellation.title' },

  tournament: { id: 'tournament', title: 'guide.tournament.title' },
  minesweeper: { id: 'minesweeper', title: 'guide.minesweeper.title' },
};
