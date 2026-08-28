import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { IMAGE_EXTENSIONS, imageSrc, revokeImages, setImage } from '../../../shared/admin-full-resource.model';
import { emptyPiece, PieceWrapper } from '../artifact-form.model';

@Component({
  selector: 'app-artifact-pieces-tab',
  templateUrl: './pieces-tab.component.html',
  styleUrls: ['./pieces-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, DropdownComponent, FileComponent, FieldContainerComponent, TooltipComponent],
})
export class PiecesTabComponent {
  pieces = model<PieceWrapper[]>([]);
  pieceTypes = input<string[]>([]);

  readonly imageExtensions = IMAGE_EXTENSIONS;

  /** Types not yet used, so a set cannot get two Plumes. */
  availableTypes = computed(() => {
    const used = new Set(this.pieces().map((piece) => piece.data.type));
    return this.pieceTypes().filter((type) => !used.has(type));
  });

  canAdd = computed(() => this.availableTypes().length > 0);

  addPiece(): void {
    const type = this.availableTypes()[0];
    if (!type) {
      return;
    }
    this.pieces.update((pieces) => [...pieces, emptyPiece(type)]);
  }

  /** Adds every type the set is still missing, in the canonical order. */
  addAllMissing(): void {
    const missing = this.availableTypes();
    this.pieces.update((pieces) => [...pieces, ...missing.map((type) => emptyPiece(type))]);
  }

  removePiece(wrapper: PieceWrapper): void {
    revokeImages(Object.values(wrapper.images));
    this.pieces.update((pieces) => pieces.filter((piece) => piece !== wrapper));
  }

  iconSrc(wrapper: PieceWrapper): string | undefined {
    return imageSrc(wrapper.images.icon, wrapper.data.icon);
  }

  onIconSelect(wrapper: PieceWrapper, files: FileItemType[] | undefined | null): void {
    const slot = wrapper.images.icon ?? {};
    setImage(slot, files?.[0]?.file);
    wrapper.images.icon = slot;
  }

  /** The piece's own type plus the ones nobody else has taken. */
  typeOptionsFor(wrapper: PieceWrapper): string[] {
    return this.pieceTypes().filter((type) => type === wrapper.data.type || this.availableTypes().includes(type));
  }
}
