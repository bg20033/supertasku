import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DiagnosisEntry } from '../diagnosis-entry/diagnosis-entry.component';
import { MinItemsValidationPipe, RequiredValidationPipe } from '../../../../core/pipes';

type QuestionType = 'yes_no' | 'yes_no_with_details' | 'text' | 'date';

@Component({
  selector: 'app-standard-question-card',
  imports: [ReactiveFormsModule, DiagnosisEntry, RequiredValidationPipe, MinItemsValidationPipe],
  templateUrl: './standard-question-card.component.html',
  styleUrl: './standard-question-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandardQuestionCard {
  readonly group = input.required<FormGroup>();
  readonly title = input.required<string>();
  readonly personIndex = input.required<number>();
  readonly questionType = input.required<QuestionType>();
  readonly showDetails = input(false);
  readonly addRequested = output<void>();
  readonly removeRequested = output<number>();

  protected details(): FormArray {
    return this.group().get('details') as FormArray;
  }

  protected asGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  protected hasError(control: AbstractControl | null, errorCode?: string): boolean {
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : true;
  }

  protected inputId(suffix = 'input'): string {
    return `question-${this.personIndex()}-${this.questionKey()}-${suffix}`;
  }

  protected entryKey(detailIndex: number): string {
    return `person-${this.personIndex()}-${this.questionKey()}-${detailIndex}`;
  }

  protected requestAdd(): void {
    this.addRequested.emit();
  }

  protected requestRemove(index: number): void {
    this.removeRequested.emit(index);
  }

  private questionKey(): string {
    return String(this.group().get('key')?.value ?? '');
  }
}
