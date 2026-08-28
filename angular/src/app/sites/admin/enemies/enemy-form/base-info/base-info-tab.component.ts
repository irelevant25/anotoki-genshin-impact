import { Component, model } from '@angular/core';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { IMAGE_EXTENSIONS, imageSrc, setImage } from '../../../shared/admin-full-resource.model';
import { emptyEnemy, EnemyWrapper } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [TextComponent, TextareaComponent, FileComponent, FieldContainerComponent, TooltipComponent],
})
export class BaseInfoTabComponent {
  enemy = model<EnemyWrapper>(emptyEnemy());

  readonly imageExtensions = IMAGE_EXTENSIONS;

  iconSrc(): string | undefined {
    return imageSrc(this.enemy().images.icon, this.enemy().data.icon);
  }

  onIconSelect(files: FileItemType[] | undefined | null): void {
    this.enemy.update((enemy) => {
      const slot = enemy.images.icon ?? {};
      setImage(slot, files?.[0]?.file);
      return { ...enemy, images: { ...enemy.images, icon: slot } };
    });
  }
}
