import { Component, computed, input, model } from '@angular/core';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent } from '@anotoki/lib/ui/forms';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { NumberFieldComponent } from '@anotoki/lib/ui/number-field';
import { NumberFieldDirective } from '../../../../../shared/local-lib/fields/number-field.directive';
import { ChoiceFieldDirective } from '../../../../../shared/local-lib/fields/choice-field.directive';
import { Audited, Material } from '../../../../../api';
import { MaterialIconDirective } from '../../../shared/material-icon.directive';
import { emptyRecipe, RecipeWrapper } from '../food-form.model';

@Component({
  selector: 'app-food-recipe-tab',
  templateUrl: './recipe-tab.component.html',
  styleUrls: ['./recipe-tab.component.scss'],
  imports: [TooltipDirective, ButtonComponent, SelectComponent, NumberFieldComponent, NumberFieldDirective, ChoiceFieldDirective, MaterialIconDirective],
})
export class RecipeTabComponent {
  recipe = model<RecipeWrapper[]>([]);
  materials = input<Audited<Material>[]>([]);

  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name, data: material })));

  addIngredient(): void {
    this.recipe.update((recipe) => [...recipe, emptyRecipe()]);
  }

  removeIngredient(wrapper: RecipeWrapper): void {
    this.recipe.update((recipe) => recipe.filter((entry) => entry !== wrapper));
  }
}
