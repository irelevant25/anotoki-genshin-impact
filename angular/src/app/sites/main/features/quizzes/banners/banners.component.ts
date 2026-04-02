import { Component, computed, ElementRef, model, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StateService } from '../../../../../shared/state-manager.service';
import { HELPER, IImageEffect } from '../../../../../shared/helper';
import { AutocompleteComponent } from '../../../../../shared/local-lib/components/autocomplete/autocomplete.component';
import { DropdownOption, OptionsHelperService } from '../../../../../shared/local-lib/services/options-helper.service';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';

export interface IBannersState {
  triesMax: number;
  triesEffects: { try: number; class: string; }[];
  questionEntity: string;
  isQuestionComplete: boolean;
  tries: string[];
  difficulty: number;
}

interface IConfigItem {
  triesMax: number;
  triesEffects: { try: number; effect: IImageEffect; }[];
}

@Component({
  selector: 'app-quizzes-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  imports: [RouterModule, AutocompleteComponent, ButtonComponent],
  providers: []
})
export class QuizzesBannersComponent {
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement> | undefined;
  readonly CONFIG: IConfigItem = {
    triesMax: 5,
    triesEffects: [
      { try: 1, effect: HELPER.ImageEffects().effectGrayscale(1).effectBlur(2.5).effectClip(['left'], [0.5]) },
      { try: 2, effect: HELPER.ImageEffects().effectGrayscale(1).effectBlur(2.5) },
      { try: 3, effect: HELPER.ImageEffects().effectGrayscale(1) }
    ]
  };
  characters = model<DropdownOption[]>([]);
  questionEntity = model<any>();
  isQuestionComplete = model<boolean>(false);
  currentTry = model<string>('');
  isDaily = model<boolean>(false);
  tries = model<any[]>([]);
  currentEffect = computed(() => this.CONFIG.triesEffects.find((item) => item.try === this.tries().length)?.effect);

  constructor(private readonly _activatedRoute: ActivatedRoute, private readonly _stateService: StateService, public readonly optionsHelperService: OptionsHelperService, private readonly _httpClient: HttpClient) {
    this._activatedRoute.data.subscribe(data => this.isDaily.set(data['daily']));
    // this.state.set(this._stateService.getTopMenuBannersState(this.daily()));
    this._httpClient.get('/api/characters/minimal').subscribe((characters) => {
      console.log(characters);
      this.characters.set((characters as any[])?.map((character) => {
        return { key: character.id ?? '', value: character.name ?? '', data: character };
      }) ?? []);
    });
    this.newQuestion();
  }

  newQuestion(): void {
    this._httpClient.get('/api/character/random').subscribe((character) => {
      this.questionEntity.set(character as any);
      this.applyEffects();
    });
  }

  applyEffects(): void {
    if (!this.canvas) {
      console.error('No canvas found');
      return;
    }
    const image = `assets/character/namecard_banner/${this.questionEntity()?.name}.avif`;
    if (this.isQuestionComplete()) {
      HELPER.ImageEffects().draw(this.canvas.nativeElement, image);
    }
    else {
      const effect = this.CONFIG.triesEffects[this.tries().length]?.effect;
      if (effect) {
        effect.draw(this.canvas.nativeElement, image);
      }
      else {
        HELPER.ImageEffects().draw(this.canvas.nativeElement, image);
      }
    }
  }

  handleCharacterSelection(selectedCharacter: DropdownOption | undefined) {
    if (!selectedCharacter) {
      return;
    }
    const character = selectedCharacter.data as any;
    this.tries().push(character);
    if (this.tries().length === this.CONFIG.triesMax) {
      this.isQuestionComplete.set(true);
    }
    if (character.name === this.questionEntity()?.name) {
      this.isQuestionComplete.set(true);
    }
    this.applyEffects();
  }

  resetQuiz() {
    this.questionEntity.set(null);
    this.isQuestionComplete.set(false);
    this.tries.set([]);
    this.newQuestion();
  }
}
