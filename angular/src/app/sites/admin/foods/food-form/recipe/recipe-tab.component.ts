import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { Material } from '../../../../../shared/models.generated';
import { emptyRecipe, RecipeWrapper } from '../food-form.model';

@Component({
  selector: 'app-food-recipe-tab',
  templateUrl: './recipe-tab.component.html',
  styleUrls: ['./recipe-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, DropdownComponent],
})
export class RecipeTabComponent {
  recipe = model<RecipeWrapper[]>([]);
  materials = input<Material[]>([]);

  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name, data: material })));

  addIngredient(): void {
    this.recipe.update((recipe) => [...recipe, emptyRecipe()]);
  }

  removeIngredient(wrapper: RecipeWrapper): void {
    this.recipe.update((recipe) => recipe.filter((entry) => entry !== wrapper));
  }
}
