import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MinItemsValidationPipe, RequiredValidationPipe } from '../../../../core/pipes';

@Component({
  selector: 'app-question-twelve',
  imports: [ReactiveFormsModule, RequiredValidationPipe, MinItemsValidationPipe],
  templateUrl: './question-twelve.component.html',
  styleUrl: './question-twelve.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionTwelve {
  readonly question = input.required<FormGroup>();
  readonly title = input.required<string>();
  readonly personIndex = input.required<number>();
  readonly addRequested = output<void>();
  readonly removeRequested = output<number>();

  protected details(): FormArray {
    return this.question().get('details') as FormArray;
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

  protected showDetails(): boolean {
    return this.question().get('answer')?.value === 'yes';
  }

  protected showDateOrderError(detail: AbstractControl): boolean {
    return detail.hasError('invalidDateOrder') && (detail.touched || detail.dirty);
  }

  protected questionInputId(suffix = 'input'): string {
    return `question-${this.personIndex()}-12-${suffix}`;
  }

  protected detailInputId(index: number, field: string): string {
    return `${this.questionInputId(`detail-${index}`)}-${field}`;
  }

  protected recoveredName(index: number): string {
    return `${this.questionInputId(`detail-${index}`)}-recovered`;
  }

  protected requestAdd(): void {
    this.addRequested.emit();
  }

  protected requestRemove(index: number): void {
    this.removeRequested.emit(index);
  }
}
