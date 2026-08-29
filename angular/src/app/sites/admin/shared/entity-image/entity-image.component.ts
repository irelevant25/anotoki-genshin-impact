import { Component, computed, effect, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TooltipComponent } from '../../../../shared/local-lib/components/tooltip/tooltip.component';
import { ModalService } from '../../../../shared/local-lib/components/modal/modal.service';
import { AbstractInputComponent } from '../../../../shared/local-lib/abstract-input.class';
import { ImageUploadComponent, PickedImage } from '../image-upload/image-upload.component';

/**
 * One image slot on a form: the current picture, the name it is stored under,
 * and a button that opens the picker.
 *
 * The name is derived by the form from whatever the entity is called, so it
 * tracks a rename while the form is open and is never typed by hand.
 *
 * Picking does not upload. The form holds the file and sends it when saved, so
 * this works on an entity that does not exist yet.
 *
 * It is an input like any other - a required slot with no picture fails
 * validation and the form points at it, the same as an empty text field.
 */
@Component({
  selector: 'app-entity-image',
  templateUrl: './entity-image.component.html',
  styleUrls: ['./entity-image.component.scss'],
  imports: [ButtonComponent, TooltipComponent],
  providers: [
    {
      provide: AbstractInputComponent,
      useExisting: EntityImageComponent,
    },
  ],
})
export class EntityImageComponent extends AbstractInputComponent<string> {
  /** Stored path, used as the image source once saved. */
  path = input<string | null | undefined>(undefined);
  /** The name the file is stored under, derived from the entity's own name. */
  name = input<string | null | undefined>(undefined);
  /** Set once something is picked but not yet saved. */
  pending = input<PickedImage | undefined>(undefined);

  picked = output<PickedImage>();
  cleared = output<void>();

  private readonly _modals = inject(ModalService);

  /** A pending pick wins over the stored image, so the user sees their choice. */
  src = computed(() => this.pending()?.preview ?? this.path() ?? undefined);
  displayName = computed(() => this.name() ?? '');
  hasImage = computed(() => !!this.src());

  constructor() {
    super();
    // The slot holds no text of its own; what it is worth to validation is
    // whether there is a picture, stored or about to be.
    effect(() => this.value.set(this.src()));
  }

  open(): void {
    const modal = this._modals.open<ImageUploadComponent, PickedImage | undefined>(ImageUploadComponent, { size: '3' });
    modal.componentInstance.label.set(this.label());
    modal.componentInstance.name.set(this.displayName());

    modal.closed.subscribe((result) => {
      this.markAsTouched();
      if (result) {
        this.picked.emit(result);
      }
    });
  }

  clear(): void {
    this.markAsTouched();
    this.cleared.emit();
  }
}
