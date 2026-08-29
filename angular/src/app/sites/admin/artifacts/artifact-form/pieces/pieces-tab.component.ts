import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokePicked } from '../../../shared/admin-full-resource.model';
import { toAssetBaseName } from '../../../shared/asset-name';
import { emptyPiece, PieceWrapper } from '../artifact-form.model';

@Component({
  selector: 'app-artifact-pieces-tab',
  templateUrl: './pieces-tab.component.html',
  styleUrls: ['./pieces-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, DropdownComponent, FieldContainerComponent, EntityImageComponent],
})
export class PiecesTabComponent {
  pieces = model<PieceWrapper[]>([]);
  pieceTypes = input<string[]>([]);

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
    revokePicked(wrapper.pending);
    this.pieces.update((pieces) => pieces.filter((piece) => piece !== wrapper));
  }

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(wrapper: PieceWrapper): string | undefined {
    return wrapper.data.icon || undefined;
  }

  /** A piece's art is named after the piece, not the set it belongs to. */
  iconName(wrapper: PieceWrapper): string {
    return toAssetBaseName(wrapper.data.name);
  }

  onPicked(wrapper: PieceWrapper, picked: PickedImage): void {
    revokePicked(wrapper.pending);
    wrapper.pending = picked;
  }

  onCleared(wrapper: PieceWrapper): void {
    revokePicked(wrapper.pending);
    wrapper.pending = undefined;
  }

  /** The piece's own type plus the ones nobody else has taken. */
  typeOptionsFor(wrapper: PieceWrapper): string[] {
    return this.pieceTypes().filter((type) => type === wrapper.data.type || this.availableTypes().includes(type));
  }
}
