import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@anotoki/lib/translations';
import { CardComponent } from '@anotoki/lib/ui/card';
import { MaterialIconDirective } from '../../../../../../../admin/shared/material-icon.directive';
import { toggleIn } from '../../../../shared/database-helpers';
import { FOLD_FROM } from '../talents/talents-tab.component';

@Component({
  selector: 'app-character-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [TranslatePipe, CardComponent, MaterialIconDirective],
})
export class CharacterConstellationsTabComponent {
  constellations = input<any[]>([]);

  /** The constellations whose whole description the reader asked for. */
  unfolded = signal<Set<number>>(new Set());

  isLong(text: unknown): boolean {
    return String(text ?? '').length > FOLD_FROM;
  }

  toggleText(id: number): void {
    this.unfolded.update((current) => toggleIn(current, id));
  }
}
