import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../../../../../shared/local-lib/i18n/translate.pipe';

/**
 * A placeholder, as on the old site when a character had no build recorded.
 * Nothing in the schema holds builds yet - no weapons, artifact sets, stat
 * priorities or teams - so there is nothing to show for anyone.
 */
@Component({
  selector: 'app-character-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  imports: [TranslatePipe],
})
export class CharacterBuildTabComponent { }
