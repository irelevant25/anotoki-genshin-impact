import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TooltipComponent } from '../../../../shared/local-lib/components/tooltip/tooltip.component';
import { ModalService } from '../../../../shared/local-lib/components/modal/modal.service';
import { ImageUploadComponent, PickedImage } from '../image-upload/image-upload.component';

/**
 * One image slot on a form: the current picture, the name it is stored under,
 * and a button that opens the picker.
 *
 * Picking does not upload. The form holds the file and sends it when saved, so
 * this works on an entity that does not exist yet.
 */
@Component({
  selector: 'app-entity-image',
  templateUrl: './entity-image.component.html',
  styleUrls: ['./entity-image.component.scss'],
  imports: [ButtonComponent, TooltipComponent],
})
export class EntityImageComponent {
  label = input.required<string>();
  field = input.required<string>();

  /** Stored path, used as the image source once saved. */
  path = input<string | null | undefined>(undefined);
  /** Stored base name, shown under the image and pre-filled when replacing. */
  name = input<string | null | undefined>(undefined);
  /** Set once something is picked but not yet saved. */
  pending = input<PickedImage | undefined>(undefined);
  required = input<boolean>(false);

  picked = output<PickedImage>();
  cleared = output<void>();

  private readonly _modals = inject(ModalService);

  /** A pending pick wins over the stored image, so the user sees their choice. */
  src = computed(() => this.pending()?.preview ?? this.path() ?? undefined);
  displayName = computed(() => this.pending()?.name ?? this.name() ?? '');
  hasImage = computed(() => !!this.src() || !!this.displayName());

  open(): void {
    const modal = this._modals.open<ImageUploadComponent, PickedImage | undefined>(ImageUploadComponent, { size: '3' });
    modal.componentInstance.field.set(this.field());
    modal.componentInstance.label.set(this.label());
    modal.componentInstance.currentName.set(this.displayName());
    modal.componentInstance.init();

    modal.closed.subscribe((result) => {
      if (result) {
        this.picked.emit(result);
      }
    });
  }

  clear(): void {
    this.cleared.emit();
  }
}
