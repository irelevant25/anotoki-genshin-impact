import { HELPER } from '../../../../../shared/helper';

/**
 * Recipe Master's questions, as pure functions, as quizzes/mismatch/mismatch-sets.ts
 * is Mismatch's: the dishes there are to ask, the ten drawn for a game, and
 * what a question scores. Nothing here reaches for a service or a signal.
 *
 * A question is a dish with its ingredients and three that are not, every
 * one of them a material some recipe takes - so a wrong one is never
 * something no dish is made of (the owner's game of 2026-10-29). A dish is
 * worth three points and every wrong pick costs two: no mistake 3, one 1, two
 * -1, all three -3 (the owner's choice). A question is over once every
 * ingredient is picked; ten make a game, out of thirty.
 */

/** How many dishes a game asks. */
export const QUESTION_COUNT = 10;

/** How many wrong ingredients stand among a dish's own. */
export const WRONG_COUNT = 3;

/** What a dish is worth without a mistake, and what every wrong pick takes off it. */
export const DISH_POINTS = 3;
export const WRONG_PICK_COST = 2;

/** The most a game can score. */
export const MAX_SCORE = QUESTION_COUNT * DISH_POINTS;

/** A line of a recipe, as GET /api/foods-recipe answers it: a food, a material. */
export interface RecipeLine {
  readonly food_id: number;
  readonly material_id: number;
  readonly deleted?: boolean;
}

/** A dish that can be asked: the food, and its ingredients' material ids, each once. */
export interface RecipeDish<F> {
  readonly food: F;
  readonly ingredients: readonly number[];
}

/** One question of a game, and what has been picked of it so far. */
export interface RecipeQuestion<F> {
  readonly dish: RecipeDish<F>;
  /** The dish's ingredients and the wrong ones, in the order they are shown. */
  readonly options: readonly number[];
  /** What was picked, in the order it was - right or wrong, each option once. */
  readonly picked: readonly number[];
}

/**
 * Every dish that can be asked: a food that is not deleted with a recipe line
 * that is not, whose material is one of `materials` (the live ones) - its
 * ingredients each once, in the recipe's order. A food left with none is no
 * question.
 */
export function recipeDishes<F extends { readonly id: number; readonly deleted?: boolean }>(foods: readonly F[], lines: readonly RecipeLine[], materials: ReadonlySet<number>): RecipeDish<F>[] {
  const byFood = new Map<number, number[]>();
  for (const line of lines) {
    if (line.deleted || !materials.has(line.material_id)) {
      continue;
    }
    const ingredients = byFood.get(line.food_id) ?? [];
    if (!ingredients.includes(line.material_id)) {
      ingredients.push(line.material_id);
    }
    byFood.set(line.food_id, ingredients);
  }
  return foods.flatMap((food) => {
    const ingredients = byFood.get(food.id);
    return !food.deleted && ingredients?.length ? [{ food, ingredients }] : [];
  });
}

/**
 * A game's questions: `count` dishes drawn at random, each with `WRONG_COUNT`
 * wrong ingredients drawn from every other ingredient a recipe takes, all of
 * them shuffled. Two dishes made of the same ingredients - a special dish is
 * cooked from its base dish's recipe - are never in one game: they would be
 * the same question twice. Fewer than `count` when there are not so many.
 */
export function drawQuestions<F>(dishes: readonly RecipeDish<F>[], count = QUESTION_COUNT): RecipeQuestion<F>[] {
  const pool = [...new Set(dishes.flatMap((dish) => dish.ingredients))];
  const asked = new Set<string>();
  const questions: RecipeQuestion<F>[] = [];
  for (const dish of HELPER.shuffleArray(dishes)) {
    const recipe = [...dish.ingredients].sort((a, b) => a - b).join(',');
    const wrong = HELPER.shuffleArray(pool.filter((id) => !dish.ingredients.includes(id))).slice(0, WRONG_COUNT);
    if (asked.has(recipe) || wrong.length < WRONG_COUNT) {
      continue;
    }
    asked.add(recipe);
    questions.push({ dish, options: HELPER.shuffleArray([...dish.ingredients, ...wrong]), picked: [] });
    if (questions.length === count) {
      break;
    }
  }
  return questions;
}

/** Whether an option is one of the dish's ingredients. */
export function isIngredient<F>(question: RecipeQuestion<F>, id: number): boolean {
  return question.dish.ingredients.includes(id);
}

/** How many of the dish's ingredients are picked. */
export function foundCount<F>(question: RecipeQuestion<F>): number {
  return question.picked.filter((id) => isIngredient(question, id)).length;
}

/** How many wrong ones were picked. */
export function wrongCount<F>(question: RecipeQuestion<F>): number {
  return question.picked.length - foundCount(question);
}

/** Over: every ingredient picked. */
export function isAnswered<F>(question: RecipeQuestion<F>): boolean {
  return question.dish.ingredients.every((id) => question.picked.includes(id));
}

/** The question with `id` picked - the same question when it was picked already, is no option of it, or is over. */
export function withPick<F>(question: RecipeQuestion<F>, id: number): RecipeQuestion<F> {
  return question.picked.includes(id) || !question.options.includes(id) || isAnswered(question) ? question : { ...question, picked: [...question.picked, id] };
}

/** What a question scores: 3, less 2 for every wrong pick - 3, 1, -1 or -3. */
export function questionPoints<F>(question: RecipeQuestion<F>): number {
  return DISH_POINTS - WRONG_PICK_COST * wrongCount(question);
}
