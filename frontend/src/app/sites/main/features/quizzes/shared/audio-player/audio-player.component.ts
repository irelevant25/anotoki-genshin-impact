import { Component, computed, effect, ElementRef, input, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '../../../../../../shared/local-lib/i18n/translate.pipe';

/**
 * The player the music and voice quizzes share.
 *
 * It is not a general audio player: its whole job is to let you hear only part
 * of a clip. Each wrong guess buys a few more seconds, so `limit` moves and the
 * player must refuse to play past it - which is why it has its own transport
 * rather than using the browser's controls, which would happily play to the end.
 *
 * The old site had two copies of this, one in music.js and one in voice.js,
 * identical down to the variable names.
 */
@Component({
  selector: 'app-quiz-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
  imports: [TranslatePipe],
})
export class QuizAudioPlayerComponent {
  readonly src = input<string>('');

  /** Seconds the listener is allowed to hear. Undefined means the whole clip. */
  readonly limit = input<number | undefined>(undefined);

  private readonly _audio = viewChild<ElementRef<HTMLAudioElement>>('audio');
  private _frame: number | null = null;

  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);

  /** Where the clip stops: the limit, or the end of the file if there is none. */
  readonly endTime = computed(() => {
    const duration = this.duration();
    const limit = this.limit();
    return limit === undefined || limit === null ? duration : Math.min(limit, duration || limit);
  });

  readonly progress = computed(() => {
    const end = this.endTime();
    return end > 0 ? Math.min(100, (this.currentTime() / end) * 100) : 0;
  });

  readonly currentTimeText = computed(() => formatTime(this.currentTime()));
  readonly durationText = computed(() => formatTime(this.endTime()));

  constructor() {
    // A new clip, or a longer allowance, sends the playhead back to the start:
    // the point of earning more seconds is to hear the piece again with them,
    // not to resume where the last cut-off was.
    effect(() => {
      this.src();
      this.limit();
      this.restart();
    });
  }

  onLoadedMetadata(): void {
    this.duration.set(this._audio()?.nativeElement.duration ?? 0);
  }

  onPlay(): void {
    this.isPlaying.set(true);
    this._track();
  }

  onPause(): void {
    this.isPlaying.set(false);
    this._stopTracking();
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this._stopTracking();
    this.restart();
  }

  play(): void {
    const audio = this._audio()?.nativeElement;
    if (!audio) {
      return;
    }
    // Pressing play after being cut off should start over rather than do
    // nothing, which is what resuming from the stop point would look like.
    if (audio.currentTime >= this.endTime()) {
      audio.currentTime = 0;
    }
    void audio.play();
  }

  pause(): void {
    this._audio()?.nativeElement.pause();
  }

  restart(): void {
    const audio = this._audio()?.nativeElement;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    this.currentTime.set(0);
  }

  /**
   * Follows the playhead frame by frame rather than on `timeupdate`, which the
   * browser fires about four times a second - too coarse both for a progress
   * bar that should glide and for stopping close to the limit.
   */
  private _track(): void {
    this._stopTracking();
    const step = () => {
      const audio = this._audio()?.nativeElement;
      if (!audio) {
        return;
      }
      this.currentTime.set(audio.currentTime);

      if (audio.currentTime >= this.endTime()) {
        this.pause();
        this.restart();
        return;
      }

      this._frame = requestAnimationFrame(step);
    };
    this._frame = requestAnimationFrame(step);
  }

  private _stopTracking(): void {
    if (this._frame !== null) {
      cancelAnimationFrame(this._frame);
      this._frame = null;
    }
  }
}

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
