import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DiagnosisEntry } from '../diagnosis-entry/diagnosis-entry.component';
import { MinItemsValidationPipe, RequiredValidationPipe } from '../../../../core/pipes';

enum Status {
  YES = 'yes',
  NO = 'no',
}

@Component({
  selector: 'app-question-seven',
  imports: [ReactiveFormsModule, DiagnosisEntry, RequiredValidationPipe, MinItemsValidationPipe],
  templateUrl: './question-seven.component.html',
  styleUrl: './question-seven.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionSeven {
  readonly operationQuestion = input.required<FormGroup>();
  readonly title = input.required<string>();
  readonly personIndex = input.required<number>();
  readonly addRequested = output<void>();
  readonly removeRequested = output<number>();

  protected readonly implantStatusOptions = [
    { value: 'retained', label: 'Verbleibt' },
    { value: 'removed', label: 'Entfernt' },
    { value: 'scheduled_removal', label: 'Wird entfernt' },
  ] as const;

  protected details(): FormArray {
    return this.operationQuestion().get('details') as FormArray;
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

  protected showOperationFollowup(): boolean {
    return this.operationQuestion().get('answer')?.value === Status.YES;
  }

  protected showImplantDetails(detail: AbstractControl): boolean {
    return detail.get('implantAnswer')?.value === 'yes';
  }

  protected questionInputId(suffix = 'input'): string {
    return `question-${this.personIndex()}-${this.questionKey(this.operationQuestion())}-${suffix}`;
  }

  protected detailInputId(index: number, field: string): string {
    return `${this.questionInputId(`detail-${index}`)}-${field}`;
  }

  protected implantToggleName(index: number): string {
    return `${this.questionInputId(`detail-${index}`)}-implant-answer`;
  }

  protected diagnosisEntryKey(index: number): string {
    return `person-${this.personIndex()}-${this.questionKey(this.operationQuestion())}-${index}`;
  }

  protected requestAdd(): void {
    this.addRequested.emit();
  }

  protected requestRemove(index: number): void {
    this.removeRequested.emit(index);
  }

  protected updateImplantAnswer(detail: AbstractControl, answer: 'yes' | 'no'): void {
    detail.get('implantAnswer')?.setValue(answer);

    if (answer !== 'yes') {
      detail.get('implantDetails')?.setValue('');
      detail.get('implantStatus')?.setValue('');
    }
  }

  private questionKey(question: FormGroup): string {
    return String(question.get('key')?.value ?? '');
  }
}
