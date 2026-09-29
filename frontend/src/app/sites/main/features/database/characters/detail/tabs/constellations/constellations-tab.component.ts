import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../../../admin/shared/material-icon.directive';

@Component({
  selector: 'app-character-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [TranslatePipe, MaterialIconDirective],
})
export class CharacterConstellationsTabComponent {
  constellations = input<any[]>([]);
}
