import type { TranslationParams } from '@anotoki/lib/translations';
import { QuizId, QuizLevel } from './quiz.types';

/**
 * The quizzes' difficulties: what each level of each quiz shows, try by try.
 *
 * Every level of every "which character is this?" quiz has the same five
 * tries (the owner's rule of 2026-10-19). The Profile counts tries and wins
 * across difficulties - one win rate, one average of tries per question, the
 * same for each quiz and each character - so a level with fewer tries would
 * pull a player's figures down for having chosen it, and a lost question
 * would count fewer tries on hard than on easy. A level is harder by what it
 * shows instead: less of the picture, a coarser grid, shorter pieces of the
 * track or the recording. On every level each wrong guess shows more, until
 * there is nothing left to hide (the quizzes' guides say so). Mismatch has no
 * tries - one pick ends a question - and is harder by how many characters it
 * offers.
 *
 * A try's step names how the question is hidden after that many wrong
 * guesses: CSS classes for a picture (quiz-question.scss) or a voice line's
 * text (voice.component.scss), or a number - pixelate's grid, the seconds of
 * a track or a recording that may be heard. A step with neither hides
 * nothing; once a question is over, nothing is hidden at all.
 *
 * The difficulty dialog says each level in words (levelWords below): the
 * numbers go into its sentences as they are, but the picture's and the voice
 * line's steps are written out in quiz.levelInfo.* - a change to those steps
 * is a change to their words too (a users/ migration).
 */
export const QUIZ_LEVELS: Readonly<Record<QuizId, Readonly<Record<number, QuizLevel>>>> = {
  // The namecard: on easy half of it, then all of it; each harder level starts
  // further off and lifts one thing a guess - the crop, the blur, the grey.
  banners: {
    1: {
      triesMax: 5,
      triesEffects: [{ try: 0, class: 'shown-half' }, { try: 1 }, { try: 2 }, { try: 3 }, { try: 4 }],
    },
    2: {
      triesMax: 5,
      triesEffects: [{ try: 0, class: 'shown-half shown-grey-blurred' }, { try: 1, class: 'shown-grey-blurred' }, { try: 2, class: 'shown-grey' }, { try: 3 }, { try: 4 }],
    },
    3: {
      triesMax: 5,
      triesEffects: [
        { try: 0, class: 'shown-quarter shown-grey-blurred-more' },
        { try: 1, class: 'shown-half shown-grey-blurred-more' },
        { try: 2, class: 'shown-half shown-grey-blurred' },
        { try: 3, class: 'shown-grey-blurred' },
        { try: 4, class: 'shown-grey' },
      ],
    },
  },
  // A grid of blocks, finer with each wrong guess.
  pixelate: {
    1: {
      triesMax: 5,
      triesEffects: [
        { try: 0, data: 7 },
        { try: 1, data: 12 },
        { try: 2, data: 17 },
        { try: 3, data: 22 },
        { try: 4, data: 27 },
      ],
    },
    2: {
      triesMax: 5,
      triesEffects: [
        { try: 0, data: 6 },
        { try: 1, data: 10 },
        { try: 2, data: 14 },
        { try: 3, data: 18 },
        { try: 4, data: 22 },
      ],
    },
    3: {
      triesMax: 5,
      triesEffects: [
        { try: 0, data: 5 },
        { try: 1, data: 8 },
        { try: 2, data: 11 },
        { try: 3, data: 14 },
        { try: 4, data: 17 },
      ],
    },
  },
  mismatch: {
    1: { choicesAmount: 3 },
    2: { choicesAmount: 4 },
    3: { choicesAmount: 5 },
  },
  // Seconds of the track from its start; on easy the last guess has all of it.
  music: {
    1: {
      triesMax: 5,
      triesEffects: [{ try: 0, data: 5 }, { try: 1, data: 10 }, { try: 2, data: 15 }, { try: 3, data: 20 }, { try: 4 }],
    },
    2: {
      triesMax: 5,
      triesEffects: [
        { try: 0, data: 3 },
        { try: 1, data: 6 },
        { try: 2, data: 9 },
        { try: 3, data: 12 },
        { try: 4, data: 15 },
      ],
    },
    3: {
      triesMax: 5,
      triesEffects: [
        { try: 0, data: 2 },
        { try: 1, data: 4 },
        { try: 2, data: 6 },
        { try: 3, data: 8 },
        { try: 4, data: 10 },
      ],
    },
  },
  // The dish, hidden as the namecard is.
  dish: {
    1: {
      triesMax: 5,
      triesEffects: [{ try: 0, class: 'shown-half' }, { try: 1 }, { try: 2 }, { try: 3 }, { try: 4 }],
    },
    2: {
      triesMax: 5,
      triesEffects: [{ try: 0, class: 'shown-half shown-grey-blurred' }, { try: 1, class: 'shown-grey-blurred' }, { try: 2, class: 'shown-grey' }, { try: 3 }, { try: 4 }],
    },
    3: {
      triesMax: 5,
      triesEffects: [
        { try: 0, class: 'shown-quarter shown-grey-blurred-more' },
        { try: 1, class: 'shown-half shown-grey-blurred-more' },
        { try: 2, class: 'shown-half shown-grey-blurred' },
        { try: 3, class: 'shown-grey-blurred' },
        { try: 4, class: 'shown-grey' },
      ],
    },
  },
  // The line's text first, part of it and then all of it, with no player
  // (`hidden-audio`); then seconds of the recording - or, with neither, all of it.
  voice: {
    1: {
      triesMax: 5,
      triesEffects: [{ try: 0, class: 'half-text hidden-audio' }, { try: 1, class: 'hidden-audio' }, { try: 2, data: 0.5 }, { try: 3 }, { try: 4 }],
    },
    2: {
      triesMax: 5,
      triesEffects: [
        { try: 0, class: 'half-text hidden-audio' },
        { try: 1, class: 'hidden-audio' },
        { try: 2, data: 0.5 },
        { try: 3, data: 1 },
        { try: 4, data: 2 },
      ],
    },
    3: {
      triesMax: 5,
      triesEffects: [
        { try: 0, class: 'quarter-text hidden-audio' },
        { try: 1, class: 'half-text hidden-audio' },
        { try: 2, class: 'hidden-audio' },
        { try: 3, data: 0.5 },
        { try: 4, data: 1 },
      ],
    },
  },
};

/**
 * The daily run's level: the same for everybody, as the two quizzes it sets
 * are (daily.ts) - never a player's choice. Easy, which is what every daily
 * question has been played at.
 */
export const DAILY_DIFFICULTY = 1;

/** One level of one quiz; an unknown one is nothing. */
export function quizLevel(quizId: QuizId, difficulty: number): QuizLevel {
  return QUIZ_LEVELS[quizId]?.[difficulty] ?? {};
}

/** 1, 2 or 3; anything else - an old or hand-made saved choice - is easy. */
export function knownDifficulty(value: unknown): number {
  const difficulty = Number(value);
  return difficulty === 2 || difficulty === 3 ? difficulty : 1;
}

/** A sentence of the difficulty dialog: its key, and what goes into it. */
export interface LevelWords {
  readonly key: string;
  readonly params?: TranslationParams;
}

// The picture's and the voice line's steps in words, by level - written out
// whole, so that the key scan (php translations.php --status) sees them.
const PICTURE_WORDS: Readonly<Record<number, string>> = {
  1: 'quiz.levelInfo.pictureEasy',
  2: 'quiz.levelInfo.pictureMedium',
  3: 'quiz.levelInfo.pictureHard',
};
const VOICE_WORDS: Readonly<Record<number, string>> = {
  1: 'quiz.levelInfo.voiceEasy',
  2: 'quiz.levelInfo.voiceMedium',
  3: 'quiz.levelInfo.voiceHard',
};

/**
 * What a level of a quiz is like, for the difficulty dialog. The grid, the
 * seconds and the characters on offer are read from the level itself, so the
 * sentence says what the quiz does.
 */
export function levelWords(quizId: QuizId, difficulty: number): LevelWords {
  const level = quizLevel(quizId, difficulty);
  const steps = level.triesEffects ?? [];
  const first = steps[0]?.data;
  const last = steps[steps.length - 1]?.data;

  switch (quizId) {
    case 'banners':
    case 'dish':
      return { key: PICTURE_WORDS[difficulty] ?? PICTURE_WORDS[1] };
    case 'voice':
      return { key: VOICE_WORDS[difficulty] ?? VOICE_WORDS[1] };
    case 'pixelate':
      return { key: 'quiz.levelInfo.pixelate', params: { first, last } };
    case 'music':
      // A last step with no number of its own plays the whole track.
      return last === undefined ? { key: 'quiz.levelInfo.musicWhole', params: { first } } : { key: 'quiz.levelInfo.music', params: { first, last } };
    case 'mismatch':
      return { key: 'quiz.levelInfo.mismatch', params: { count: level.choicesAmount } };
  }
}
