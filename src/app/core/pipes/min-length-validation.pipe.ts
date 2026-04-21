import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minLengthValidation',
  standalone: true,
})
export class MinLengthValidationPipe implements PipeTransform {
  transform(value: any, minLength: number): boolean {
    if (!value) {
      return true; 
    }

    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length >= minLength;
    }

    return true;
  }
}
