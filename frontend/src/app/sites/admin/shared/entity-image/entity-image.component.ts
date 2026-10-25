import { Component, computed, ElementRef, inject, input, OnDestroy, output, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { AnotokiDialog } from '@anotoki/lib/ui/dialog';
import { CheckedField, FormChecks, isMissing, REQUIRED_WORDS } from '../../../../shared/local-lib/fields/form-checks';
import { ImageUploadComponent, ImageUploadData, PickedImage } from '../image-upload/image-upload.component';

/**
 * One image slot on a form: the current picture, the name it is stored under,
 * and a button that opens the picker. With `kind` 'audio' it is a slot for a
 * sound instead (a character's demo music), shown as a player.
 *
 * The name is derived by the form from whatever the entity is called, so it
 * tracks a rename while the form is open and is never typed by hand.
 *
 * Picking does not upload. The form holds the file and sends it when saved, so
 * this works on an entity that does not exist yet.
 *
 * It is a field like any other to its form's save (FormChecks) - a required
 * slot with no picture is wrong, says so once it has been used or a save has
 * asked, and the form points at it, the same as an empty text field.
 */
@Component({
  selector: 'app-entity-image',
  templateUrl: './entity-image.component.html',
  styleUrls: ['./entity-image.component.scss'],
  imports: [TooltipDirective, ButtonComponent],
})
export class EntityImageComponent implements CheckedField, OnDestroy {
  /** What the slot is called, over it and in the picker's heading. */
  label = input<string>('');
  /** A picture must be in the slot, stored or picked. */
  required = input<boolean>(false);
  /** Stored path, used as the image source once saved. */
  path = input<string | null | undefined>(undefined);
  /** The name the file is stored under, derived from the entity's own name. */
  name = input<string | null | undefined>(undefined);
  /** Set once something is picked but not yet saved. */
  pending = input<PickedImage | undefined>(undefined);
  /** What the slot holds: a picture, or a sound. */
  kind = input<'image' | 'audio'>('image');

  picked = output<PickedImage>();
  cleared = output<void>();

  readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private readonly _dialogs = inject(AnotokiDialog);
  private readonly _checks = inject(FormChecks);
  private readonly _touched = signal(false);

  /** A pending pick wins over the stored image, so the user sees their choice. */
  src = computed(() => this.pending()?.preview ?? this.path() ?? undefined);
  displayName = computed(() => this.name() ?? '');
  hasImage = computed(() => !!this.src());

  /**
   * The picture's tooltip (the kit's, which holds words): the file it shows - a fresh pick by its own name, a file
   * chosen from the catalogue by its name, a stored one by where it is kept.
   */
  readonly fileWords = computed(() => {
    const pending = this.pending();
    return pending?.file?.name ?? pending?.existing?.name ?? this.path()?.replace(/^(\.\.\/)+/, '') ?? null;
  });

  /** What it is worth to its form's save: whether there is a picture, stored or about to be. */
  readonly wrong = computed(() => this.required() && isMissing(this.src()));
  /** Said under the slot once it has been used or a save asked, while it is wrong. */
  readonly error = computed(() => (this._touched() && this.wrong() ? REQUIRED_WORDS : null));

  constructor() {
    this._checks.add(this);
  }

  ngOnDestroy(): void {
    this._checks.remove(this);
  }

  touch(): void {
    this._touched.set(true);
  }

  open(): void {
    const modal = this._dialogs.open<ImageUploadComponent, PickedImage | undefined, ImageUploadData>(ImageUploadComponent, {
      size: 'lg',
      data: {
        label: this.label(),
        name: this.displayName(),
        kind: this.kind(),
        // Open the "choose existing" browser on this slot's own folder, worked out
        // from where the current picture lives, so the likely files are shown first.
        folderHint: this._folderFromPath(this.path()),
      },
    });

    void modal.closed.then((result) => {
      this.touch();
      if (result) {
        this.picked.emit(result);
      }
    });
  }

  /** `assets/character/icon/HU_TAO.avif` → `character/icon`; empty if unknown. */
  private _folderFromPath(path: string | null | undefined): string {
    if (!path) {
      return '';
    }
    const relative = path.replace(/^(\.\.\/)?assets\//, '');
    const slash = relative.lastIndexOf('/');
    return slash === -1 ? '' : relative.slice(0, slash);
  }

  clear(): void {
    this.touch();
    this.cleared.emit();
  }
}
