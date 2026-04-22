import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { startWith } from 'rxjs';
import { NoScientificNotationDirective } from '../../core/directives/no-scientific-notation.directive';
import { HealthDeclarationFormService } from '../../core/services/health-declaration-form.service';
import { FormFooterComponent } from '../../core/components/form-footer/form-footer.component';
import { NumericRangeValidationPipe, RequiredValidationPipe } from '../../core/pipes';
import { BodyMetricsForm } from './components/body-metrics-form/body-metrics-form.component';
import { DoctorInfoForm } from './components/doctor-info-form/doctor-info-form.component';
import { QuestionSeven } from './components/question-seven/question-seven.component';
import { QuestionTwelve } from './components/question-twelve/question-twelve.component';
import { ReviewPanel } from './components/review-panel/review-panel.component';
import { StandardQuestionCard } from './components/standard-question-card/standard-question-card.component';
import { Topbar } from './components/topbar/topbar.component';

type QuestionType = 'yes_no' | 'yes_no_with_details' | 'text' | 'date';
type DentalSelectionState = {
  dentalUpper: boolean[];
  dentalLower: boolean[];
  parodontitisUpper: boolean[];
  parodontitisLower: boolean[];
};
type LifestyleSubstance = {
  key: 'nicotine' | 'alcohol' | 'drug';
  label: string;
  useControl: string;
  unitsControl: string;
  frequencyControl: string;
  fromControl: string;
  toControl: string;
};

@Component({
  selector: 'app-health-form-view',
  imports: [
    ReactiveFormsModule,
    FormFooterComponent,
    BodyMetricsForm,
    DoctorInfoForm,
    NoScientificNotationDirective,
    NumericRangeValidationPipe,
    RequiredValidationPipe,
    QuestionSeven,
    QuestionTwelve,
    ReviewPanel,
    StandardQuestionCard,
    Topbar,
  ],
  templateUrl: './health-form.component.html',
  styleUrl: './health-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthFormViewView {
  protected readonly declaration = inject(HealthDeclarationFormService);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly formSnapshot = toSignal(
    this.declaration.form.valueChanges.pipe(startWith(this.declaration.form.getRawValue())),
    { initialValue: this.declaration.form.getRawValue() },
  );
  protected readonly openingQuestionKeys = ['1', '1a', '1b'] as const;
  protected readonly medicalHistoryQuestionKeys = [
    '4',
    '4a',
    '4b',
    '5',
    '6',
    '7',
    '8',
    '9',
    '9a',
    '10',
    '10a',
  ] as const;
  protected readonly postMedicationQuestionKeys = [
    '18.2',
    '18.3',
    '18.4',
    '18.5',
    '18.6',
    '18.7',
    '18.8',
    '18.9',
    '18.10',
    '18.11',
  ] as const;
  protected readonly dentaOptions = [
    "Bis CHF 1'000.-",
    "CHF 1'000.- bis CHF 3'000.-",
    "CHF 3'000.- bis CHF 5'000.-",
    "Ueber CHF 5'000.-",
  ] as const;
  protected readonly jawCostOptions = [
    "Bis CHF 5'000.-",
    "CHF 1'000.- bis CHF 3'000.-",
    "CHF 3'000.- bis CHF 5'000.-",
    "Ueber CHF 10'000.-",
  ] as const;
  protected readonly conditionOptions = ['Gut', 'Mittel', 'Schlecht'] as const;
  protected readonly dentalChartLabels = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8] as const;
  protected readonly yesNoChoiceOptions = [
    { value: 'no' as const, label: 'Nein' },
    { value: 'yes' as const, label: 'Ja' },
  ] as const;
  protected readonly bleedingOptions = ['Ja', 'Nein', 'Teilweise', 'Ueberall'] as const;
  private readonly emptyDentalSelectionState: DentalSelectionState = {
    dentalUpper: Array(16).fill(false),
    dentalLower: Array(16).fill(false),
    parodontitisUpper: Array(16).fill(false),
    parodontitisLower: Array(16).fill(false),
  };
  private readonly personDentalSelections = signal<Record<string, DentalSelectionState>>({});
  private readonly currentPersonDentalSelectionKey = computed(() => {
    const personIndex = this.declaration.currentPersonIndex();
    const person = this.declaration.personAt(personIndex);
    return person ? this.declaration.personId(person) || `person-${personIndex}` : `person-${personIndex}`;
  });
  private readonly currentDentalSelectionState = computed(
    () =>
      this.personDentalSelections()[this.currentPersonDentalSelectionKey()] ??
      this.emptyDentalSelectionState,
  );
  protected readonly selectedDentalCellsUpper = computed(
    () => this.currentDentalSelectionState().dentalUpper,
  );
  protected readonly selectedDentalCellsLower = computed(
    () => this.currentDentalSelectionState().dentalLower,
  );
  protected readonly selectedParodontitisCellsUpper = computed(
    () => this.currentDentalSelectionState().parodontitisUpper,
  );
  protected readonly selectedParodontitisCellsLower = computed(
    () => this.currentDentalSelectionState().parodontitisLower,
  );
  protected readonly lifestyleSubstances: LifestyleSubstance[] = [
    {
      key: 'nicotine',
      label: 'Nikotin (z.B. E-Zigaretten, Zigarren, Shishas, Snus, Pfeifen)',
      useControl: 'nicotineUse',
      unitsControl: 'nicotineUnits',
      frequencyControl: 'nicotineFrequency',
      fromControl: 'nicotineFrom',
      toControl: 'nicotineTo',
    },
    {
      key: 'alcohol',
      label: 'Alkohol (1 Einheit = 1 dl Wein, 3 dl Bier oder 4 cl Spirituosen)',
      useControl: 'alcoholUse',
      unitsControl: 'alcoholUnits',
      frequencyControl: 'alcoholFrequency',
      fromControl: 'alcoholFrom',
      toControl: 'alcoholTo',
    },
    {
      key: 'drug',
      label: 'Drogen',
      useControl: 'drugUse',
      unitsControl: 'drugUnits',
      frequencyControl: 'drugFrequency',
      fromControl: 'drugFrom',
      toControl: 'drugTo',
    },
  ];
  protected readonly currentPersonValid = computed(() => {
    this.formSnapshot();
    this.declaration.currentPersonIndex();
    const person = this.activePerson();
    if (!person) return false;
    const allInvalidControls: { [personIndex: number]: string[] } = {};
    let hasAnyInvalid = false;

    for (let i = 0; i < this.people.length; i++) {
      const personForm = this.people.at(i) as FormGroup;
      if (personForm.invalid) {
        allInvalidControls[i] = this.findInvalidControls(personForm);
        hasAnyInvalid = true;
      }
    }

    if (hasAnyInvalid) {
      console.warn('All invalid form controls across all persons:', allInvalidControls);
    }

    return person.valid;
  });

  private findInvalidControls(group: FormGroup | FormArray, path = ''): string[] {
    let invalid: string[] = [];
    Object.entries(group.controls).forEach(([key, ctrl]) => {
      const p = path ? `${path}.${key}` : key;
      if (ctrl instanceof FormGroup || ctrl instanceof FormArray) {
        invalid = invalid.concat(this.findInvalidControls(ctrl, p));
      } else if (ctrl.invalid) {
        invalid.push(p);
      }
    });
    return invalid;
  }

  protected get people(): FormArray {
    return this.declaration.peopleArray;
  }

  protected activePerson(): FormGroup {
    return (
      this.declaration.personAt(this.declaration.currentPersonIndex()) ??
      (this.people.at(0) as FormGroup)
    );
  }

  protected asGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  protected profileGroup(person: AbstractControl): FormGroup {
    return person.get('profile') as FormGroup;
  }

  protected bodyMetricsGroup(person: AbstractControl): FormGroup {
    return person.get('bodyMetrics') as FormGroup;
  }

  protected doctorInfoGroup(person: AbstractControl): FormGroup {
    return person.get('doctorInfo') as FormGroup;
  }

  protected dentalInfoGroup(person: AbstractControl): FormGroup {
    return person.get('dentalInfo') as FormGroup;
  }

  protected lifestyleGroup(person: AbstractControl): FormGroup {
    return person.get('lifestyle') as FormGroup;
  }

  protected questionArray(person: AbstractControl): FormArray {
    return this.declaration.questionArray(person);
  }

  protected editFamily(): void {
    this.router.navigate(['/family']);
  }

  protected addDiagnosis(question: AbstractControl): void {
    this.declaration.addDiagnosis(question);
  }

  protected removeDiagnosis(question: AbstractControl, index: number): void {
    this.declaration.removeDiagnosis(question, index);
  }

  protected finalizeCurrentPerson(): void {
    const result = this.declaration.finalizeCurrentPerson();

    if (result === 'advanced') {
      requestAnimationFrame(() => {
        this.viewportScroller.scrollToPosition([0, 0]);
      });
    }
  }

  protected questionControl(person: AbstractControl, key: string): FormGroup | null {
    return (
      (this.questionArray(person).controls.find(
        (question) => this.questionKey(question) === key,
      ) as FormGroup | undefined) ?? null
    );
  }

  protected text(control: AbstractControl, path: string): string {
    const value = control.get(path)?.value;
    return typeof value === 'string' ? value : '';
  }

  protected isChecked(control: AbstractControl, path: string): boolean {
    return control.get(path)?.value === true;
  }

  protected questionKey(question: AbstractControl): string {
    return this.text(question, 'key');
  }

  protected questionType(question: AbstractControl): QuestionType {
    return (question.get('type')?.value as QuestionType) ?? 'yes_no';
  }

  protected questionTitle(question: AbstractControl): string {
    const key = this.questionKey(question);
    const prompt = this.text(question, 'prompt');

    if (/^\d+$/.test(key)) {
      const number = Number(key);

      if (number >= 1 && number <= 13) {
        return `${key}. ${prompt}`;
      }
    }

    return prompt;
  }

  protected showQuestion(person: AbstractControl, question: AbstractControl): boolean {
    return this.declaration.isQuestionVisible(person, this.questionKey(question));
  }

  protected shouldRenderGenericMedicalHistoryQuestion(key: string): boolean {
    return key !== '7' && key !== '8';
  }

  protected requiresQuestionDetails(question: AbstractControl): boolean {
    return this.declaration.questionRequiresDetails(this.questionKey(question));
  }

  protected showDiagnosisDetails(question: AbstractControl): boolean {
    return this.requiresQuestionDetails(question) && question.get('answer')?.value === 'yes';
  }

  protected isAnsweredYes(question: AbstractControl | null): boolean {
    return question?.get('answer')?.value === 'yes';
  }

  protected shouldShowPregnancyFields(person: AbstractControl): boolean {
    const isFemale = person.get('profile.gender')?.value === 'female';
    const answeredYes = this.isAnsweredYes(this.questionControl(person, '11'));

    return isFemale && answeredYes;
  }

  protected shouldShowLifestyleFields(person: AbstractControl): boolean {
    const isNotBaby = person.get('profile.gender')?.value !== 'baby';
    const answeredYes = this.isAnsweredYes(this.questionControl(person, '13'));

    return isNotBaby && answeredYes;
  }

  protected shouldShowParodontitisFields(person: AbstractControl): boolean {
    return this.isAnsweredYes(this.questionControl(person, '16'));
  }

  protected shouldShowJawFields(person: AbstractControl): boolean {
    return this.isAnsweredYes(this.questionControl(person, '17'));
  }

  protected shouldShowJawWorkFields(person: AbstractControl): boolean {
    return this.text(this.dentalInfoGroup(person), 'jawExpectedWork') === 'yes';
  }

  protected shouldShowHygieneReason(person: AbstractControl): boolean {
    const hygiene = this.text(this.dentalInfoGroup(person), 'hygiene');
    return hygiene === 'Mittel' || hygiene === 'Schlecht';
  }

  protected finishButtonLabel(): string {
    return this.declaration.currentPersonIndex() < this.people.length - 1
      ? 'Naechste Person'
      : 'Zur Pruefung';
  }

  protected hasError(control: AbstractControl | null, errorCode?: string): boolean {
    if (!control) {
      return false;
    }

    if (!control.invalid || !(control.touched || control.dirty)) {
      return false;
    }

    return errorCode ? control.hasError(errorCode) : true;
  }

  protected questionInputId(question: AbstractControl, suffix = 'input'): string {
    return `question-${this.declaration.currentPersonIndex()}-${this.questionKey(question)}-${suffix}`;
  }

  protected lifestyleInputId(field: string): string {
    return `lifestyle-${this.declaration.currentPersonIndex()}-${field}`;
  }

  private createEmptyDentalRow(): boolean[] {
    return Array(16).fill(false);
  }

  private createEmptyDentalSelectionState(): DentalSelectionState {
    return {
      dentalUpper: this.createEmptyDentalRow(),
      dentalLower: this.createEmptyDentalRow(),
      parodontitisUpper: this.createEmptyDentalRow(),
      parodontitisLower: this.createEmptyDentalRow(),
    };
  }

  private selectedCellIndexes(values: boolean[]): number[] {
    return values.flatMap((isSelected, index) => (isSelected ? [index + 1] : []));
  }

  private logDentalSelection(personIndex: number, personKey: string, state: DentalSelectionState): void {
    console.log(`[DentalFinding] Person ${personIndex + 1} (${personKey}) selection updated`);
    console.log({
      dentalUpper: this.selectedCellIndexes(state.dentalUpper),
      dentalLower: this.selectedCellIndexes(state.dentalLower),
      parodontitisUpper: this.selectedCellIndexes(state.parodontitisUpper),
      parodontitisLower: this.selectedCellIndexes(state.parodontitisLower),
    });
  }

  protected onDentalCellClick(index: number, isUpper: boolean, isParodontitis: boolean): void {
    const selectionKey = this.currentPersonDentalSelectionKey();
    const personIndex = this.declaration.currentPersonIndex();
    const selectionField: keyof DentalSelectionState = isParodontitis
      ? isUpper
        ? 'parodontitisUpper'
        : 'parodontitisLower'
      : isUpper
        ? 'dentalUpper'
        : 'dentalLower';

    this.personDentalSelections.update((existing) => {
      const currentState = existing[selectionKey] ?? this.createEmptyDentalSelectionState();
      const nextValues = [...currentState[selectionField]];
      nextValues[index] = !nextValues[index];

      const nextState: DentalSelectionState = {
        ...currentState,
        [selectionField]: nextValues,
      };

      this.logDentalSelection(personIndex, selectionKey, nextState);

      return {
        ...existing,
        [selectionKey]: nextState,
      };
    });
  }
}
