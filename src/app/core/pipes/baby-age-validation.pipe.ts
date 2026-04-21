import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'babyAgeValidation',
  standalone: true,
})
export class BabyAgeValidationPipe implements PipeTransform {
  transform(value: string): boolean {
    if (!value) {
      return true; 
    }

    const birthStr = value.trim();

    const monthMatch = birthStr.match(/^(\d{4})-(\d{2})$/);
    const yearMatch = birthStr.match(/^(\d{4})$/);

    let birthYear: number;
    let birthMonth: number = 1;

    if (monthMatch) {
      birthYear = Number(monthMatch[1]);
      birthMonth = Number(monthMatch[2]);
    } else if (yearMatch) {
      birthYear = Number(yearMatch[1]);
    } else {
      return false; 
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const monthsDiff = (currentYear - birthYear) * 12 + (currentMonth - birthMonth);

    if (monthsDiff >= 9) {
      return false;
    }

    return true;
  }
}
