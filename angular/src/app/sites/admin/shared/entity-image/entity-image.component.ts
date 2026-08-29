import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { TooltipComponent } from '../../../../shared/local-lib/components/tooltip/tooltip.component';
import { ModalService } from '../../../../shared/local-lib/components/modal/modal.service';
import { EntityUploadResult } from '../../services/admin-api.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

/**
 * One image slot on a form: the current picture, its stored name, and a button
 * that opens the upload modal.
 *
 * Uploading writes to the row immediately, so it needs an id - on a form that
 * has not been saved yet the button explains that instead.
 */
@Component({
  selector: 'app-entity-image',
  templateUrl: './entity-image.component.html',
  styleUrls: ['./entity-image.component.scss'],
  imports: [ButtonComponent, TooltipComponent],
})
export class EntityImageComponent {
  label = input.required<string>();
  entity = input.required<string>();
  field = input.required<string>();
  /** Null until the row is saved; uploading is disabled while it is. */
  entityId = input<number | null>(null);

  /** Stored path, used as the image source. */
  path = input<string | null | undefined>(undefined);
  /** Stored base name, shown under the image and pre-filled when replacing. */
  name = input<string | null | undefined>(undefined);
  required = input<boolean>(false);

  /** Emitted after a successful upload so the form can update its state. */
  uploaded = output<EntityUploadResult>();

  private readonly _modals = inject(ModalService);

  canUpload = computed(() => !!this.entityId());
  hasImage = computed(() => !!this.path() || !!this.name());

  /** Falls back to the name when no path is stored yet, as some tables have none. */
  src = computed(() => this.path() || undefined);

  open(): void {
    const id = this.entityId();
    if (!id) {
      return;
    }
    const modal = this._modals.open<ImageUploadComponent, EntityUploadResult | undefined>(ImageUploadComponent, { size: '3' });
    modal.componentInstance.entity.set(this.entity());
    modal.componentInstance.entityId.set(id);
    modal.componentInstance.field.set(this.field());
    modal.componentInstance.label.set(this.label());
    modal.componentInstance.currentName.set(String(this.name() ?? ''));
    modal.componentInstance.init();

    modal.closed.subscribe((result) => {
      if (result) {
        this.uploaded.emit(result);
      }
    });
  }
}
