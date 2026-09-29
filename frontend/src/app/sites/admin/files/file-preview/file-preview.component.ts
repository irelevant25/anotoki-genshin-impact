import { Component, computed, inject, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../shared/local-lib/abstract-modal.class';
import { ModalComponent } from '../../../../shared/local-lib/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { AudioPlayerComponent } from '../../../../shared/local-lib/components/audio-player/audio-player.component';
import { AssetFile } from '../../../../api';
import { ConfigService } from '../../../../shared/local-lib/services/config.service';

export const PREVIEWABLE_IMAGES = ['avif', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
export const PLAYABLE_AUDIO = ['ogg', 'mp3', 'wav', 'opus', 'm4a', 'aac', 'flac'];

export function isPreviewableFile(extension: string): boolean {
  return PREVIEWABLE_IMAGES.includes(extension) || PLAYABLE_AUDIO.includes(extension);
}

/** Full-size view of one asset: the image at its natural size, or a player. */
@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  imports: [ModalComponent, ButtonComponent, AudioPlayerComponent],
})
export class FilePreviewComponent extends AbstractModalComponent {
  /** The API path the listing hands back, with the backend in front of it. */
  private readonly _config = inject(ConfigService);

  readonly src = computed(() => {
    const file = this.file();
    if (!file) {
      return '';
    }
    return (this._config.backendUrl ?? '').replace(/\/$/, '') + file.url;
  });

  /** Set by the opener before the modal renders. */
  file = signal<AssetFile | undefined>(undefined);

  /** Natural pixel size, once the image reports it. */
  naturalWidth = signal(0);
  naturalHeight = signal(0);
  /** False shows the image at 1:1 instead of scaled down to the modal. */
  fitToWindow = signal(true);
  failed = signal(false);

  isImage = computed(() => PREVIEWABLE_IMAGES.includes(this.file()?.extension ?? ''));
  isAudio = computed(() => PLAYABLE_AUDIO.includes(this.file()?.extension ?? ''));

  dimensionsLabel = computed(() => (this.naturalWidth() ? `${this.naturalWidth()} × ${this.naturalHeight()} px` : ''));

  /** Only worth offering 1:1 when it would actually differ from the fitted view. */
  canToggleSize = computed(() => this.naturalWidth() > 0);

  sizeLabel = computed(() => {
    const bytes = this.file()?.size ?? 0;
    return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
  });

  onImageLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    this.naturalWidth.set(image.naturalWidth);
    this.naturalHeight.set(image.naturalHeight);
  }

  toggleSize(): void {
    this.fitToWindow.update((fit) => !fit);
  }

  close(): void {
    this.modalRef?.close();
  }
}
