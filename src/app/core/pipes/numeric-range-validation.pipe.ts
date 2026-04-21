import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numericRangeValidation',
  standalone: true,
})
export class NumericRangeValidationPipe implements PipeTransform {
  transform(value: any, minimum: number, maximum: number): boolean {
    const rawValue = value;
    const val =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string' && rawValue.trim()
          ? Number(rawValue)
          : null;

    if (val === null) {
      return true; 
    }

    if (!Number.isFinite(val)) {
      return false;
    }

    if (val < minimum || val > maximum) {
      return false;
    }

    return true;
  }
}
