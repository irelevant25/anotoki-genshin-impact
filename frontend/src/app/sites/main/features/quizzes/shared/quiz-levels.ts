import type { TranslationParams } from '@anotoki/lib/translations';
import { QUIZ_DIFFICULTIES, QuizEffect, QuizId, QuizLevel } from './quiz.types';

/** Every quiz's levels, by difficulty: 1 easy, 2 medium, 3 hard. */
export type QuizLevels = Readonly<Record<QuizId, Readonly<Record<number, QuizLevel>>>>;

/** The quizzes, in the order the levels list them (and the admin panel's Quiz levels page with them). */
export const QUIZ_IDS: readonly QuizId[] = ['banners', 'pixelate', 'mismatch', 'music', 'dish', 'voice'];

/**
 * The quizzes' built-in difficulties: what each level of each quiz shows, try
 * by try.
 *
 * Built in, because the levels are data now (the owner's decision of
 * 2026-10-21): an ADMIN or an EDITOR changes them on the admin panel's Quiz
 * levels page, and what is saved there replaces these whole, held to the
 * server's rules (backend api/quiz_levels.php, users/061). These are what
 * every page plays while nothing is saved, while it asks for the levels in
 * force and whenever asking fails (QuizLevelsService): a quiz never breaks or
 * waits on that question. They pass the server's rules (the backend's
 * quiz-levels test reads them from this file), so "Back to the defaults" and
 * a first save of them always work.
 *
 * Every level of every "which character is this?" quiz has the same five
 * tries (the owner's rule of 2026-10-19, which the server holds every saved
 * level to). The Profile counts tries and wins across difficulties - one win
 * rate, one average of tries per question, the same for each quiz and each
 * character - so a level with fewer tries would pull a player's figures down
 * for having chosen it, and a lost question would count fewer tries on hard
 * than on easy. A level is harder by what it shows instead: less of the
 * picture, a coarser grid, shorter pieces of the track or the recording. On
 * every level each wrong guess shows more, until there is nothing left to hide
 * (the quizzes' guides say so). Mismatch has no tries - one pick ends a
 * question - and is harder by how many characters it offers.
 *
 * A try's step names how the question is hidden after that many wrong
 * guesses: CSS classes for a picture (quiz-question.scss) or a voice line's
 * text (voice.component.scss), or a number - pixelate's grid, the seconds of
 * a track or a recording that may be heard. A step with neither hides
 * nothing; once a question is over, nothing is hidden at all.
 *
 * The difficulty dialog says each level in words (levelWords below): the
 * numbers go into its sentences from the levels in force, but the picture's
 * steps and the voice line's are written out in quiz.levelInfo.* - the Quiz
 * levels page warns when a level's steps leave those words behind, and a Voice
 * level playing fewer pieces of the recording than its sentence names is said
 * in general words (quiz.levelInfo.voiceOther).
 */
export const QUIZ_LEVELS: QuizLevels = {
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
 * are (daily.ts) - never a player's choice. Easy - level 1 of the levels in
 * force -, which is what every daily question has been played at.
 */
export const DAILY_DIFFICULTY = 1;

/** One level of one quiz among $levels; an unknown one is nothing. */
export function levelOf(levels: QuizLevels, quizId: QuizId, difficulty: number): QuizLevel {
  return levels[quizId]?.[difficulty] ?? {};
}

/** 1, 2 or 3; anything else - an old or hand-made saved choice - is easy. */
export function knownDifficulty(value: unknown): number {
  const difficulty = Number(value);
  return difficulty === 2 || difficulty === 3 ? difficulty : 1;
}

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** A Mismatch level: how many characters, at least three (two can make no set with one odd one out). */
function usableChoices(level: unknown): QuizLevel | null {
  const amount = isObject(level) ? level['choicesAmount'] : undefined;
  return isNumber(amount) && Number.isInteger(amount) && amount >= 3 ? { choicesAmount: amount } : null;
}

/** A level of tries: as many steps as tries, each its own try's, a class a text and a number a number. */
function usableSteps(level: unknown): QuizLevel | null {
  if (!isObject(level) || !isNumber(level['triesMax']) || !Array.isArray(level['triesEffects']) || level['triesEffects'].length !== level['triesMax']) {
    return null;
  }
  const steps: QuizEffect[] = [];
  for (const [index, step] of (level['triesEffects'] as unknown[]).entries()) {
    if (!isObject(step) || step['try'] !== index || ('class' in step && typeof step['class'] !== 'string') || ('data' in step && !isNumber(step['data']))) {
      return null;
    }
    steps.push({ try: index, ...(typeof step['class'] === 'string' ? { class: step['class'] } : {}), ...(isNumber(step['data']) ? { data: step['data'] } : {}) });
  }
  return { triesMax: level['triesMax'], triesEffects: steps };
}

/**
 * The levels an answer of GET /api/quiz/levels holds, if they are levels the
 * pages can play - the six quizzes' three levels, each a level of its kind -
 * or null, and the built-in levels stay. The server holds what it keeps to
 * its rules, before it keeps it and again as it answers (backend
 * api/quiz_levels.php); this only makes sure that an answer from anywhere
 * else - a proxy's page, a server of another version - never reaches a quiz.
 */
export function usableLevels(value: unknown): QuizLevels | null {
  if (!isObject(value)) {
    return null;
  }
  const levels: Partial<Record<QuizId, Record<number, QuizLevel>>> = {};
  for (const quizId of QUIZ_IDS) {
    const byLevel = value[quizId];
    if (!isObject(byLevel)) {
      return null;
    }
    const kept: Record<number, QuizLevel> = {};
    for (const difficulty of QUIZ_DIFFICULTIES) {
      const level = quizId === 'mismatch' ? usableChoices(byLevel[String(difficulty)]) : usableSteps(byLevel[String(difficulty)]);
      if (level === null) {
        return null;
      }
      kept[difficulty] = level;
    }
    levels[quizId] = kept;
  }
  return levels as QuizLevels;
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

/** The key of the words that say a picture's or a voice line's level (the others' say only numbers, which follow). */
export function levelWordsKey(quizId: QuizId, difficulty: number): string | null {
  return quizId === 'banners' || quizId === 'dish' ? (PICTURE_WORDS[difficulty] ?? null) : quizId === 'voice' ? (VOICE_WORDS[difficulty] ?? null) : null;
}

/** The seconds of the recording a level's steps play, in their order: one number a piece. */
export function piecesOf(level: QuizLevel): number[] {
  return (level.triesEffects ?? []).flatMap((step) => (step.data === undefined ? [] : [step.data]));
}

/**
 * How many pieces of the recording a Voice level's own sentence names - as many as the built-in level plays (Easy one,
 * Medium three, Hard two): a key's placeholders are its English's, which a rewording keeps.
 */
export function voicePiecesNamed(difficulty: number): number {
  return piecesOf(levelOf(QUIZ_LEVELS, 'voice', difficulty)).length;
}

/**
 * What a level of a quiz is like, for the difficulty dialog. The grid, the
 * seconds and the characters on offer are read from the level itself - the
 * one in force -, so the sentence says what the quiz does; the dialog writes
 * them in the reader's language.
 */
export function levelWords(quizId: QuizId, difficulty: number, level: QuizLevel): LevelWords {
  const steps = level.triesEffects ?? [];
  const first = steps[0]?.data;
  const last = steps[steps.length - 1]?.data;

  switch (quizId) {
    case 'banners':
    case 'dish':
      return { key: levelWordsKey(quizId, difficulty) ?? PICTURE_WORDS[1] };
    case 'voice': {
      // The seconds of the recording, in the order the steps play them: the words name the first, the second and the
      // third. A level that plays fewer pieces than its words name is said in general words - never a number missing.
      const pieces = piecesOf(level);
      if (pieces.length < voicePiecesNamed(difficulty)) {
        return { key: 'quiz.levelInfo.voiceOther' };
      }
      const [firstPlayed, secondPlayed, thirdPlayed] = pieces;
      return { key: levelWordsKey(quizId, difficulty) ?? VOICE_WORDS[1], params: { first: firstPlayed, second: secondPlayed, third: thirdPlayed } };
    }
    case 'pixelate':
      return { key: 'quiz.levelInfo.pixelate', params: { first, last } };
    case 'music':
      // A last step with no number of its own plays the whole track.
      return last === undefined ? { key: 'quiz.levelInfo.musicWhole', params: { first } } : { key: 'quiz.levelInfo.music', params: { first, last } };
    case 'mismatch':
      return { key: 'quiz.levelInfo.mismatch', params: { count: level.choicesAmount } };
  }
}
