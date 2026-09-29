import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeSince',
  standalone: true,
})
export class TimeSincePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      console.warn(`AppDatePipe: invalid date "${value}"`);
      return value.toString();
    }

    // transform date to "time since" format
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) {
      return `Pred ${seconds} ${seconds === 1 ? 'sekundou' : 'sekundami'}`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `Pred ${minutes} ${minutes === 1 ? 'minútou' : 'minutami'}`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Pred ${hours} ${hours === 1 ? 'hodinou' : 'hodinami'}`;
    }
    const days = Math.floor(hours / 24);
    return `Pred ${days} ${days === 1 ? 'dňom' : 'dňami'}`;
  }
}

// EXAMPLES:

// {{ "2024-06-01T12:00:00Z" | timeSince }} -> "Pred 1 hodinou"
// {{ "2024-06-01T12:00:00Z" | timeSince }} -> "Pred 5 minútami"
// {{ "2024-06-01T12:30:00Z" | timeSince }} -> "Pred 30 sekundami"
