import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'birthYearValidation',
  standalone: true,
})
export class BirthYearValidationPipe implements PipeTransform {
  transform(value: string): boolean {
    const rawValue = value;
    const val = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim();

    if (!val) {
      return true;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; 

    let year: number;
    let month: number = 1;

    const monthMatch = val.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      year = Number(monthMatch[1]);
      month = Number(monthMatch[2]);
      if (month < 1 || month > 12) {
        return false;
      }
    } else if (/^\d{4}$/.test(val)) {
      year = Number(val);
    } else {
      return false;
    }

    if (year < currentYear - 120 || year > currentYear) {
      return false;
    }

    if (year === currentYear && month > currentMonth) {
      return false;
    }

    return true;
  }
}
