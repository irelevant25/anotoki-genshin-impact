import { Component, computed, DestroyRef, effect, ElementRef, inject, input, linkedSignal, signal, untracked, viewChild } from '@angular/core';
import { TranslatePipe } from '@anotoki/lib/translations';

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

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

  /** The clip's length, from its metadata: none from the moment the clip changes until the new one's comes, never the last one's. */
  readonly duration = linkedSignal({ source: this.src, computation: () => 0 });

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
    //
    // The player stops here by itself rather than waiting for the element to
    // say so. A new `src` loads the element, and loading pauses it without a
    // `pause` event - and takes away the one restart()'s pause() had just
    // queued (the HTML media load algorithm) - so after Next onPause() never
    // ran: Play stayed disabled, and the playhead's loop went on.
    effect(() => {
      this.src();
      this.limit();
      untracked(() => {
        this._stop();
        this.restart();
      });
    });

    // A player taken off the page mid-clip (Voice hides it again for the next
    // question) is paused once its listeners are gone, so onPause() never
    // hears of that either.
    inject(DestroyRef).onDestroy(() => this._stopTracking());
  }

  onLoadedMetadata(): void {
    this.duration.set(this._audio()?.nativeElement.duration ?? 0);
  }

  /** Sent as a new clip loads, where no `pause` is: the element has let go of the old clip, and nothing is known of the new one yet. */
  onEmptied(): void {
    this._stop();
    this.duration.set(0);
    this.currentTime.set(0);
  }

  onPlay(): void {
    this.isPlaying.set(true);
    this._track();
  }

  onPause(): void {
    this._stop();
  }

  onEnded(): void {
    this._stop();
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
    // A play() that does not get to play rejects: paused, or a new clip loaded,
    // before its sound came (AbortError), the browser withholding its leave to
    // play (NotAllowedError), a file it cannot read. Nothing plays then - and a
    // rejection left unhandled would be reported to the site's error log as a
    // failure of the page.
    audio.play().catch(() => {
      if (audio.paused) {
        this._stop();
      }
    });
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
    const step = (): void => {
      const audio = this._audio()?.nativeElement;
      if (!audio) {
        return;
      }
      this.currentTime.set(audio.currentTime);

      // An end not known yet - the whole of a clip whose metadata is still on
      // its way (a language just changed, after the question) - is no end: it
      // plays on until `ended`.
      const end = this.endTime();
      if (end > 0 && audio.currentTime >= end) {
        this.pause();
        this.restart();
        return;
      }

      this._frame = requestAnimationFrame(step);
    };
    this._frame = requestAnimationFrame(step);
  }

  /** Not playing, whatever the element is about to say. */
  private _stop(): void {
    this.isPlaying.set(false);
    this._stopTracking();
  }

  private _stopTracking(): void {
    if (this._frame !== null) {
      cancelAnimationFrame(this._frame);
      this._frame = null;
    }
  }
}
