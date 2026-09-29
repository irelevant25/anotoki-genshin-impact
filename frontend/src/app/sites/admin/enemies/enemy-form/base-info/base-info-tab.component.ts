import { Component, model } from '@angular/core';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokePicked } from '../../../shared/admin-full-resource.model';
import { toAssetBaseName } from '../../../shared/asset-name';
import { emptyEnemy, EnemyWrapper } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextComponent, TextareaComponent, FieldContainerComponent, EntityImageComponent],
})
export class BaseInfoTabComponent {
  enemy = model<EnemyWrapper>(emptyEnemy());

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(): string | undefined {
    return this.enemy().data.icon || undefined;
  }

  /** Derived from the name input, so it follows a rename while the form is open. */
  iconName(): string {
    return toAssetBaseName(this.enemy().data.name);
  }

  onPicked(picked: PickedImage): void {
    this.enemy.update((enemy) => {
      revokePicked(enemy.pending.icon);
      return { ...enemy, pending: { ...enemy.pending, icon: picked } };
    });
  }

  onCleared(): void {
    this.enemy.update((enemy) => {
      revokePicked(enemy.pending.icon);
      const pending = { ...enemy.pending };
      delete pending.icon;
      return { ...enemy, pending };
    });
  }
}
