import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patternValidation',
  standalone: true,
})
export class PatternValidationPipe implements PipeTransform {
  transform(value: string, pattern: RegExp | string): boolean {
    if (!value) {
      return true; 
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(value);
  }
}
