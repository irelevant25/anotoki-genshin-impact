import { Component, computed, effect, ElementRef, input, model, signal, ViewChild } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

/**
 * Small audio player: play/pause, a seekable progress bar and elapsed/total
 * time. Wraps a real `<audio>` element so formats and buffering are the
 * browser's problem, and only the controls are ours.
 */
@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
  imports: [ButtonComponent],
})
export class AudioPlayerComponent {
  @ViewChild('audioElement') private _audio?: ElementRef<HTMLAudioElement>;

  src = input.required<string>();
  /** Shown above the controls; the file name, usually. */
  label = input<string | undefined>(undefined);
  autoplay = input<boolean>(false);

  playing = model<boolean>(false);
  currentTime = signal(0);
  duration = signal(0);
  error = signal(false);

  progress = computed(() => (this.duration() > 0 ? (this.currentTime() / this.duration()) * 100 : 0));
  elapsedLabel = computed(() => this.formatTime(this.currentTime()));
  durationLabel = computed(() => (this.duration() > 0 ? this.formatTime(this.duration()) : '--:--'));

  constructor() {
    // A new source resets the transport; the element reloads on its own.
    effect(() => {
      this.src();
      this.currentTime.set(0);
      this.duration.set(0);
      this.error.set(false);
      this.playing.set(false);
    });
  }

  togglePlay(): void {
    const audio = this._audio?.nativeElement;
    if (!audio || this.error()) {
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => this.error.set(true));
    } else {
      audio.pause();
    }
  }

  stop(): void {
    const audio = this._audio?.nativeElement;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    this.currentTime.set(0);
  }

  /** Seeking from the range input, which reports a percentage. */
  onSeek(event: Event): void {
    const audio = this._audio?.nativeElement;
    const percent = Number((event.target as HTMLInputElement).value);
    if (!audio || !Number.isFinite(percent) || this.duration() <= 0) {
      return;
    }
    audio.currentTime = (percent / 100) * this.duration();
    this.currentTime.set(audio.currentTime);
  }

  onLoadedMetadata(): void {
    const audio = this._audio?.nativeElement;
    // Streams of unknown length report Infinity; treat that as "no duration".
    const duration = audio?.duration ?? 0;
    this.duration.set(Number.isFinite(duration) ? duration : 0);
  }

  onTimeUpdate(): void {
    this.currentTime.set(this._audio?.nativeElement.currentTime ?? 0);
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }
}
