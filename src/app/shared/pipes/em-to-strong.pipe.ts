import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'emToStrong'
})
export class EmToStrongPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/<em.*?>(.*?)<\/em>/g, '<strong>$1</strong>');
  }
}
