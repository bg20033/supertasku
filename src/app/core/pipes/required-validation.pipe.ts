import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'requiredValidation',
  standalone: true,
})
export class RequiredValidationPipe implements PipeTransform {
  transform(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  }
}
