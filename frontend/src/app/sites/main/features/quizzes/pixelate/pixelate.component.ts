import { Component, effect, ElementRef, viewChild } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { materialIconCandidates } from '../../../../admin/shared/material-icon.directive';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/** Side of the square the portrait is drawn into. The old site used 175 too. */
const CANVAS_SIZE = 175;

/** How coarse the grid is once the answer is out - fine enough to read clearly. */
const SOLVED_GRID = CANVAS_SIZE;

/**
 * Guess the character from a pixelated portrait.
 *
 * Each wrong guess buys a finer grid: on easy the portrait starts as 7x7 blocks
 * and works up to 27x27, which is about where a silhouette becomes a face.
 *
 * The difficulty config's number is the grid, not a block size, which is why
 * this does not go through HELPER.ImageEffects().effectPixelate - that takes the
 * block size, and the two would quietly mean opposite things.
 */
@Component({
  selector: 'app-quizzes-pixelate',
  templateUrl: './pixelate.component.html',
  styleUrls: ['./pixelate.component.scss'],
  imports: [LoaderComponent, QuizFrameComponent],
})
export class QuizzesPixelateComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'pixelate';

  private readonly _canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    super();

    // An effect rather than a call from onQuestionChanged: the question is
    // settled while the loader is still up, so the canvas is not in the DOM yet
    // and drawing then would draw nowhere. Reading the view query here means
    // this runs again the moment the canvas appears, and on every later change
    // to the question or the number of tries.
    effect(() => this._draw(this._canvas()?.nativeElement, this.questionEntity(), this.currentEffect()?.data, this.isQuestionComplete()));

    this.load();
  }

  private _draw(canvas: HTMLCanvasElement | undefined, character: any, grid: number | undefined, solved: boolean): void {
    if (!canvas || !character) {
      return;
    }

    const size = solved ? SOLVED_GRID : (grid ?? 10);

    // The portrait is a .png under an upper-cased name, but the directive's
    // candidate list is the one place that knows the naming conventions, so the
    // same list is walked here rather than guessing at a single path.
    const candidates = materialIconCandidates(character.icon_name ?? character.name, 'character.icon');
    this._drawPixelated(canvas, candidates, size);
  }

  /**
   * Draws the portrait through a tiny offscreen canvas and blows it back up with
   * smoothing off, which is what makes the blocks hard-edged rather than blurred.
   */
  private _drawPixelated(canvas: HTMLCanvasElement, candidates: string[], grid: number): void {
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const image = new Image();
    let candidate = 0;

    // The picture may be a .avif, a .png, or an upper-cased .png; only the
    // browser can say which exists, so each is tried in turn.
    image.onerror = () => {
      candidate += 1;
      if (candidate < candidates.length) {
        image.src = candidates[candidate];
      }
    };

    image.onload = () => {
      const small = document.createElement('canvas');
      small.width = grid;
      small.height = grid;
      small.getContext('2d')?.drawImage(image, 0, 0, grid, grid);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(small, 0, 0, canvas.width, canvas.height);
    };

    image.src = candidates[0] ?? '';
  }
}
