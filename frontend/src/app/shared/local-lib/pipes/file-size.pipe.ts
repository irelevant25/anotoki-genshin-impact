import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(value: null | undefined | number): string {
    if (!value) {
      return '';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1000) {
      size /= 1000;
      unitIndex += 1;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// EXAMPLES:

// {{ 123 | fileSize }} -> "123.00 B"
// {{ 12345 | fileSize }} -> "12.35 KB"
// {{ 12345678 | fileSize }} -> "12.35 MB"
// {{ 1234567890 | fileSize }} -> "1.23 GB"
// {{ 1234567890123 | fileSize }} -> "1.23 TB"
