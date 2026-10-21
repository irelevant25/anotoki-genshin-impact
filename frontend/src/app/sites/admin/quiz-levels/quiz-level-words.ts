import { QUIZ_LEVELS, QuizLevels, levelWordsKey, piecesOf, voicePiecesNamed } from '../../main/features/quizzes/shared/quiz-levels';
import { QUIZ_DIFFICULTIES, QuizEffect, QuizId } from '../../main/features/quizzes/shared/quiz.types';

/**
 * What the Quiz levels page says about levels besides the server's rules: the
 * words of the site that cannot follow them by themselves, and where a problem
 * or a warning is.
 *
 * The difficulty dialog's sentences (quiz.levelInfo.*) take every number from
 * the levels in force - Pixelate's grid, the seconds of a track and of a
 * recording, Mismatch's count - and the server's rules keep what else they
 * say true (five tries, each wrong guess showing more). What no number can
 * carry is written out for the built-in levels:
 *
 *   - Banners' and Dish's three (quiz.levelInfo.picture*) say what the classes
 *     uncover, guess by guess;
 *   - Voice's three (quiz.levelInfo.voice*) say which steps show the line and
 *     which play the recording - its seconds follow; a level playing fewer
 *     pieces than its sentence names is said in general words instead
 *     (quiz.levelInfo.voiceOther: a key keeps its English's placeholders);
 *   - Mismatch's card (quiz.mismatch.info) and its guide say three, four or
 *     five characters.
 *
 * A level whose steps leave them behind is a warning, never a refusal: the
 * words are reworded on the Translations and Guides pages, in English and
 * Slovak.
 */

/** A level's words that no longer say what it does. */
export interface LevelWordsWarning {
  readonly quiz: QuizId;
  /** The level, or null: the quiz as a whole. */
  readonly level: number | null;
  readonly message: string;
  /** The string that says it (the Translations page). */
  readonly key: string;
  /** Whether a guide says it too (the Guides page). */
  readonly guide: boolean;
}

/** The quizzes' names, and the levels', as the admin panel writes them (English). */
export const QUIZ_NAMES: Readonly<Record<QuizId, string>> = {
  banners: 'Banners',
  pixelate: 'Pixelate',
  mismatch: 'Mismatch',
  music: 'Music',
  dish: 'Dish',
  voice: 'Voice',
};
export const LEVEL_NAMES: Readonly<Record<string, string>> = { '1': 'Easy', '2': 'Medium', '3': 'Hard' };

/** Where something is: "Pixelate · Medium · try 3", "Mismatch", or "The levels" for all of them. */
export function placeOf(quiz: string | null, level: string | number | null, step: number | null = null): string {
  if (quiz === null) {
    return 'The levels';
  }
  const parts = [Object.hasOwn(QUIZ_NAMES, quiz) ? QUIZ_NAMES[quiz as QuizId] : quiz];
  if (level !== null) {
    parts.push(LEVEL_NAMES[String(level)] ?? `level ${level}`);
  }
  if (step !== null) {
    parts.push(`try ${step}`);
  }
  return parts.join(' · ');
}

/** A step as the words say it: its classes, in one order, and whether it plays a piece or the whole - not how much, which follows. */
function shape(step: QuizEffect | undefined): string {
  const classes = (step?.class ?? '').split(' ').filter(Boolean).sort().join(' ');
  return `${classes}|${step?.data === undefined ? 'whole' : 'piece'}`;
}

/** The words that no longer say what these levels do, quiz by quiz. */
export function levelWordsWarnings(levels: QuizLevels): LevelWordsWarning[] {
  const warnings: LevelWordsWarning[] = [];
  for (const quiz of ['banners', 'dish', 'voice'] as const) {
    for (const level of QUIZ_DIFFICULTIES) {
      const steps = levels[quiz][level]?.triesEffects ?? [];
      const builtIn = QUIZ_LEVELS[quiz][level]?.triesEffects ?? [];
      if (steps.length === builtIn.length && steps.every((step, index) => shape(step) === shape(builtIn[index]))) {
        continue;
      }
      const general = quiz === 'voice' && piecesOf(levels[quiz][level] ?? {}).length < voicePiecesNamed(level);
      warnings.push({
        quiz,
        level,
        key: general ? 'quiz.levelInfo.voiceOther' : (levelWordsKey(quiz, level) ?? ''),
        guide: false,
        message: general
          ? `These steps play fewer pieces of the recording than this level's own sentence names (${voicePiecesNamed(level)}), so the difficulty dialog says it in general words, true of any level.`
          : quiz === 'voice'
            ? 'The difficulty dialog says this level in words written for the built-in steps - which show the line, which play a piece of the recording and which all of it. These steps differ; their seconds follow by themselves.'
            : "The difficulty dialog says this level in words written for the built-in steps' classes - what each wrong guess uncovers. These steps hide the picture differently.",
      });
    }
  }
  const choices = QUIZ_DIFFICULTIES.map((level) => levels.mismatch[level]?.choicesAmount);
  if (choices.some((amount, index) => amount !== QUIZ_LEVELS.mismatch[QUIZ_DIFFICULTIES[index]]?.choicesAmount)) {
    warnings.push({
      quiz: 'mismatch',
      level: null,
      key: 'quiz.mismatch.info',
      guide: true,
      message: `Its card and its guide say three, four or five characters, more on a harder level - these levels show ${choices.join(', ')}. The difficulty dialog's count follows by itself; they do not.`,
    });
  }
  return warnings;
}

/** JSON as the page's editor holds it: two spaces an indent, and an object of plain values - a step, a Mismatch level - on one line. */
export function levelsText(value: unknown, indent = ''): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const inner = `${indent}  `;
    return `[\n${value.map((item) => inner + levelsText(item, inner)).join(',\n')}\n${indent}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }
    if (entries.every(([, item]) => typeof item !== 'object' || item === null)) {
      return `{ ${entries.map(([key, item]) => `${JSON.stringify(key)}: ${JSON.stringify(item)}`).join(', ')} }`;
    }
    const inner = `${indent}  `;
    return `{\n${entries.map(([key, item]) => `${inner}${JSON.stringify(key)}: ${levelsText(item, inner)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
