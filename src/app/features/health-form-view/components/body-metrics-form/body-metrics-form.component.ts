import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NumericRangeValidationPipe, RequiredValidationPipe } from '../../../../core/pipes';

@Component({
  selector: 'app-body-metrics-form',
  imports: [ReactiveFormsModule, NumericRangeValidationPipe, RequiredValidationPipe],
  templateUrl: './body-metrics-form.component.html',
  styleUrl: './body-metrics-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyMetricsForm {
  readonly group = input.required<FormGroup>();

  protected hasError(control: AbstractControl | null, errorCode?: string): boolean {
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : true;
  }
}
