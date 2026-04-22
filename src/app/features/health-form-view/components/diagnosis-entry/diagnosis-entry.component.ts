import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  DateValidationPipe,
  MinLengthValidationPipe,
  RequiredValidationPipe,
} from '../../../../core/pipes';

@Component({
  selector: 'app-diagnosis-entry',
  imports: [
    ReactiveFormsModule,
    DateValidationPipe,
    MinLengthValidationPipe,
    RequiredValidationPipe,
  ],
  templateUrl: './diagnosis-entry.component.html',
  styleUrl: './diagnosis-entry.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisEntry {
  readonly group = input.required<FormGroup>();
  readonly index = input.required<number>();
  readonly entryKey = input.required<string>();
  readonly canRemove = input(false);
  readonly showHeader = input(true);
  readonly removeRequested = output<void>();

  protected readonly title = computed(() => `${this.index() + 1}) Einzelheiten`);
  protected readonly recoveredName = computed(() => `${this.entryKey()}-recovered`);

  protected fieldId(field: string): string {
    return `${this.entryKey()}-${field}`;
  }

  protected control(path: string): AbstractControl | null {
    return this.group().get(path);
  }

  protected hasError(path: string, errorCode?: string): boolean {
    const control = this.control(path);

    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : true;
  }

  protected showDateOrderError(): boolean {
    const group = this.group();
    return group.hasError('invalidDateOrder') && (group.touched || group.dirty);
  }

  protected requestRemove(): void {
    this.removeRequested.emit();
  }
}
