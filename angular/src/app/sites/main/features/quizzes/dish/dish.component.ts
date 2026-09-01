import { Component, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';
import { FoodApiService } from '../../../../../api';

/**
 * Guess the character from the dish only they can cook.
 *
 * Hidden the same way as the banner quiz - cropped, blurred, grey - because the
 * two share a difficulty config, and a dish icon is small enough that taking
 * the colour out of it is already most of the puzzle.
 */
@Component({
  selector: 'app-quizzes-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
  imports: [LoaderComponent, MaterialIconDirective, QuizFrameComponent],
})
export class QuizzesDishComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'dish';

  constructor() {
    super();
    this.load();
  }

  /** 89 of the 111 non-traveller characters have a dish. The rest cannot be asked. */
  protected override canAsk(character: any): boolean {
    return !!character?.dish;
  }

  /**
   * `characters.special_dish` is a food id, and the quiz needs the dish's name
   * to find its picture. The two lists are independent, so they are fetched
   * together and joined here rather than one after the other.
   */
  private readonly foodApi = inject(FoodApiService);

  protected override fetchCharacters(): Observable<any[]> {
    return forkJoin({
      characters: this.characterApi.getCharactersMinimal(),
      foods: this.foodApi.getFoods(),
    }).pipe(
      map(({ characters, foods }) => {
        const foodsById = new Map(foods.map((food) => [food.id, food]));
        // Most characters have no dish of their own, and `special_dish` is null
        // for them rather than absent.
        return characters.map((character) => ({
          ...character,
          dish: character.special_dish === null ? null : foodsById.get(character.special_dish) ?? null,
        }));
      }),
    );
  }
}
