import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateValidation',
  standalone: true,
})
export class DateValidationPipe implements PipeTransform {
  transform(value: string): boolean {
    if (!value) {
      return true; // Empty is valid for optional fields
    }

    // Check format YYYY-MM
    const datePattern = /^\d{4}-\d{2}$/;
    if (!datePattern.test(value)) {
      return false;
    }

    // Parse year and month
    const [yearStr, monthStr] = value.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Validate month 1-12
    if (month < 1 || month > 12) {
      return false;
    }

    // Validate year (reasonable range, e.g., 1900-2100)
    if (year < 1900 || year > 2100) {
      return false;
    }

    // Check if it's a valid date (e.g., not Feb 30)
    const date = new Date(year, month - 1, 1);
    return date.getFullYear() === year && date.getMonth() === month - 1;
  }
}
