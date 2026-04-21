import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minItemsValidation',
  standalone: true,
})
export class MinItemsValidationPipe implements PipeTransform {
  transform(value: any, minItems: number): boolean {
    if (!value || typeof value.length !== 'number') {
      return true; 
    }

    return value.length >= minItems;
  }
}
