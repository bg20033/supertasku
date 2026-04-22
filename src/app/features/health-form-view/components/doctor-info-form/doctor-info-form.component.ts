import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NoScientificNotationDirective } from '../../../../core/directives/no-scientific-notation.directive';
import { RequiredValidationPipe } from '../../../../core/pipes';

@Component({
  selector: 'app-doctor-info-form',
  imports: [ReactiveFormsModule, NoScientificNotationDirective, RequiredValidationPipe],
  templateUrl: './doctor-info-form.component.html',
  styleUrl: './doctor-info-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorInfoForm {
  readonly group = input.required<FormGroup>();

  protected hasError(control: AbstractControl | null, errorCode?: string): boolean {
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : true;
  }
}
