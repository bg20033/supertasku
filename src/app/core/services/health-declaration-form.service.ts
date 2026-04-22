import { inject, Injectable, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { merge, Subscription } from 'rxjs';

export type PersonGender = '' | 'female' | 'male' | 'baby';
export type YesNoAnswer = '' | 'yes' | 'no';
export type PersonStepStatus = 'inactive' | 'active' | 'completed';
type QuestionType = 'yes_no' | 'yes_no_with_details' | 'text' | 'date';

const STORAGE_KEY = 'health-declaration-form-data';

interface QuestionDefinition {
  key: string;
  prompt: string;
  type: QuestionType;
  visibility: 'all' | 'non-male';
  opensDiagnosis?: boolean;
  dependsOn?: {
    questionId: string;
    answer: YesNoAnswer;
  };
}

export interface SubmissionSummary {
  submittedAt: string;
  peopleCount: number;
  people: Array<{
    id: string;
    fullName: string;
    gender: PersonGender;
    birthDate: string;
  }>;
}

const PHONE_PATTERN = /^[+()0-9\s/-]{6,}$/;
const POSTAL_CODE_PATTERN = /^\d{4,6}$/;
const STREET_NUMBER_PATTERN = /^[0-9A-Za-z/-]{1,10}$/;
const CURRENT_YEAR = new Date().getFullYear();

const QUESTION_DEFINITIONS: QuestionDefinition[] = [
  {
    key: '1',
    prompt:
      'Wurden bereits Anträge von SWICA oder von anderen Versicherern abgelehnt, zurückgestellt oder nur zu erschwerten Bedingungen angenommen? (z.B. Deckungsausschluss, Risikozuschlag bzw. Prämienerhöhung, Ablehnung des Antrags)',
    type: 'yes_no',
    visibility: 'all',
  },
  {
    key: '1a',
    prompt: 'Wenn ja, weshalb und aufgrund welcher Diagnose?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '1', answer: 'yes' },
  },
  {
    key: '1b',
    prompt: 'Bestehen noch Beschwerden oder folgen noch Behandlungen?',
    type: 'yes_no',
    visibility: 'all',
    dependsOn: { questionId: '1', answer: 'yes' },
  },
  {
    key: '4',
    prompt:
      'Waren Sie in den letzten 12 Monaten oder sind Sie zurzeit in einer Behandlung, Kontrolle oder abgeklärt worden (z.B. ärztliche, kosmetische, schönheitschirurgische, heilpädagogische, psychiatrische, präventive, psychologische, zahnärztliche, physiotherapeutische oder komplementar-/alternativmedizinische/naturheilende Behandlungen/Kontrollen/Abklärungen/Verfahren etc.)?',
    type: 'yes_no_with_details',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '4a',
    prompt: 'Welche Behandlungen?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '4', answer: 'yes' },
  },
  {
    key: '4b',
    prompt: 'Bestehen noch Beschwerden oder folgen noch Behandlungen?',
    type: 'yes_no',
    visibility: 'all',
    dependsOn: { questionId: '4', answer: 'yes' },
  },
  {
    key: '5',
    prompt:
      'Bestehen/Bestanden in den letzten 10 Jahren Krankheiten/Störungen/Beschwerden resp. wurden diese ärztlich festgestellt und/oder therapeutisch behandelt? Wenn ja, welche?',
    type: 'yes_no_with_details',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '6',
    prompt:
      'Haben Sie jemals an einer Tumorerkrankung, einem Bandscheibenvorfall, einer psychischen Krankheit oder einer Herz-Kreislauf-Erkrankung gelitten? Wenn ja, woran?',
    type: 'yes_no_with_details',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '7',
    prompt: 'Hatten Sie jemals ein Implantat oder ein Fremdkörper eingesetzt?',
    type: 'yes_no_with_details',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '8',
    prompt:
      'Hatten Sie jemals einen ambulanten oder stationären Eingriff/Operation? Wenn ja, warum?',
    type: 'yes_no_with_details',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '9',
    prompt: 'Leiden Sie an einem Geburtsgebrechen oder beziehen Sie eine UVG- oder IV-Rente?',
    type: 'yes_no',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '9a',
    prompt: 'Wenn ja, welches Geburtsgebrechen (inkl. Nummer) resp. Grund der Rente?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '9', answer: 'yes' },
  },
  {
    key: '10',
    prompt:
      'Besteht eine Zahn- oder Kieferfehlstellung und/oder ist deswegen eine Abklärung, Behandlung oder Zahnstellungskorrektur geplant resp. wurde ein Verdacht geäußert?',
    type: 'yes_no',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '10a',
    prompt: 'Sind kieferorthopaedische Arbeiten zu erwarten?',
    type: 'yes_no',
    visibility: 'all',
    dependsOn: { questionId: '10', answer: 'yes' },
  },
  {
    key: '11',
    prompt: 'Für Frauen: Besteht eine Schwangerschaft?',
    type: 'yes_no',
    visibility: 'non-male',
  },
  {
    key: '12',
    prompt:
      'Nehmen/Nahmen Sie in den letzten 5 Jahren regelmässig Medikamente/Nahrungsergänzungen ein?',
    type: 'yes_no_with_details',
    visibility: 'all',
    opensDiagnosis: true,
  },
  {
    key: '12a',
    prompt: 'Wenn ja, weshalb und aufgrund welcher Diagnose?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '12', answer: 'yes' },
  },
  {
    key: '13',
    prompt:
      'Konsumieren und/oder konsumierten Sie jemals regelmässig Nikotin, Alkohol, Drogen oder Ähnliches?',
    type: 'yes_no',
    visibility: 'all',
  },
  {
    key: '16',
    prompt: 'Parodontitis',
    type: 'yes_no',
    visibility: 'all',
  },
  {
    key: '17',
    prompt: 'Zahnstellungen- und Kieferanomalien',
    type: 'yes_no',
    visibility: 'all',
  },
  {
    key: '18.1a',
    prompt: 'Wenn mittelmaessig oder schlecht, weshalb?',
    type: 'text',
    visibility: 'all',
  },
  {
    key: '18.2',
    prompt: 'Wann wurde die letzte Behandlung abgeschlossen und aus welchem Grund?',
    type: 'text',
    visibility: 'all',
  },
  {
    key: '18.3',
    prompt: 'Wann haben Sie Ihren Patienten/Ihre Patientin erstmals behandelt?',
    type: 'date',
    visibility: 'all',
  },
  {
    key: '18.4',
    prompt: 'Wann fand die Untersuchung fuer die Zahnversicherung statt?',
    type: 'date',
    visibility: 'all',
  },
  {
    key: '18.5',
    prompt: 'Bestehen unfallbedingte Zahnschäden?',
    type: 'yes_no',
    visibility: 'all',
  },
  {
    key: '18.6',
    prompt: 'Wenn ja, welche Zähne sind betroffen?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '18.5', answer: 'yes' },
  },
  {
    key: '18.7',
    prompt:
      'Wenn ja, welche Behandlungen wurden durchgeführt bzw. welche Behandlungen stehen noch an?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '18.5', answer: 'yes' },
  },
  {
    key: '18.8',
    prompt:
      'Sind innerhalb der nächsten zwölf Monate zahnärztliche Arbeiten geplant oder erforderlich, z.B. chirurgische Eingriffe, Zahnersatz, kieferorthopädische Behandlungen?',
    type: 'yes_no',
    visibility: 'all',
  },
  {
    key: '18.9',
    prompt: 'Wenn ja, welche?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '18.8', answer: 'yes' },
  },
  {
    key: '18.10',
    prompt: 'Wann wird diese Behandlung durchgefuehrt?',
    type: 'date',
    visibility: 'all',
    dependsOn: { questionId: '18.8', answer: 'yes' },
  },
  {
    key: '18.11',
    prompt: 'Weshalb konnte die Behandlung nicht vorher durchgefuehrt werden?',
    type: 'text',
    visibility: 'all',
    dependsOn: { questionId: '18.8', answer: 'yes' },
  },
];

const QUESTION_LOOKUP = new Map(
  QUESTION_DEFINITIONS.map((definition) => [definition.key, definition]),
);

function localIsoDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60_000);
  return normalized.toISOString().slice(0, 10);
}

function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    return value <= localIsoDate(new Date()) ? null : { futureDate: true };
  };
}

function birthYearValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    const value = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue ?? '').trim();

    if (!value) {
      return null;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    let year: number;
    let month: number = 1; // default to January if only year provided

    // Match YYYY-MM or YYYY
    const monthMatch = value.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      year = Number(monthMatch[1]);
      month = Number(monthMatch[2]);
      if (month < 1 || month > 12) {
        return { invalidBirthYear: true };
      }
    } else if (/^\d{4}$/.test(value)) {
      year = Number(value);
    } else {
      return { invalidBirthYear: true };
    }

    // Check year range (0-120 years from current year)
    if (year < currentYear - 120 || year > currentYear) {
      return { invalidBirthYear: true };
    }

    // If year equals current year, month must be <= current month
    if (year === currentYear && month > currentMonth) {
      return { invalidBirthYear: true };
    }

    // If year equals currentYear - 120, month must be >= current month? Actually, we allow any month as long as year is within range. The lower bound is 120 years ago, we don't need month precision for that far back.

    return null;
  };
}

function babyAgeValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const gender = group.get('gender')?.value;
    const birthDate = group.get('birthDate')?.value;

    if (gender === 'baby' && birthDate) {
      const birthStr = String(birthDate).trim();
      // Match YYYY-MM or YYYY
      const monthMatch = birthStr.match(/^(\d{4})-(\d{2})$/);
      const yearMatch = birthStr.match(/^(\d{4})$/);

      let birthYear: number;
      let birthMonth: number = 1; // default January if only year

      if (monthMatch) {
        birthYear = Number(monthMatch[1]);
        birthMonth = Number(monthMatch[2]);
      } else if (yearMatch) {
        birthYear = Number(yearMatch[1]);
      } else {
        return { invalidBabyAge: true };
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      // Calculate total months difference
      const monthsDiff = (currentYear - birthYear) * 12 + (currentMonth - birthMonth);

      if (monthsDiff >= 9) {
        return { invalidBabyAge: true };
      }
    }

    return null;
  };
}

function numericRangeValidator(
  minimum: number,
  maximum: number,
  errorKey = 'invalidNumberRange',
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    const value =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string' && rawValue.trim()
          ? Number(rawValue)
          : null;

    if (value === null) {
      return null;
    }

    if (!Number.isFinite(value)) {
      return { invalidNumber: true };
    }

    if (value < minimum || value > maximum) {
      return { [errorKey]: { minimum, maximum } };
    }

    return null;
  };
}

function minItemsValidator(minimum: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }

    return control.length >= minimum ? null : { minItems: { minimum } };
  };
}

function dateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;

  if (!value) {
    return null; // Empty is valid for optional fields
  }

  // Check format YYYY-MM
  const datePattern = /^\d{4}-\d{2}$/;
  if (!datePattern.test(value)) {
    return { invalidDate: true };
  }

  // Parse year and month
  const [yearStr, monthStr] = value.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Validate month 1-12
  if (month < 1 || month > 12) {
    return { invalidDate: true };
  }

  // Validate year (reasonable range, e.g., 1900-2100)
  if (year < 1900 || year > 2100) {
    return { invalidDate: true };
  }

  // Check if it's a valid date (e.g., not Feb 30)
  const date = new Date(year, month - 1, 1);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1) {
    return { invalidDate: true };
  }

  return null;
}

function dateOrderValidator(fromKey: string, toKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const fromValue = control.get(fromKey)?.value as string;
    const toValue = control.get(toKey)?.value as string;

    if (!fromValue || !toValue) {
      return null;
    }

    return fromValue <= toValue ? null : { invalidDateOrder: true };
  };
}

@Injectable({ providedIn: 'root' })
export class HealthDeclarationFormService {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly subscriptions = new Map<string, Subscription>();
  private nextPersonId = 1;

  readonly currentPersonIndex = signal(0);
  readonly highestReachedPersonIndex = signal(0);
  readonly reviewMode = signal(false);
  readonly lastSubmission = signal<SubmissionSummary | null>(null);
  readonly completedPersonIds = signal(new Set<string>());
  readonly form = this.fb.group({
    people: this.fb.array([this.createPerson('Selbst')]),
  });

  readonly questions = QUESTION_DEFINITIONS;

  constructor() {
    // Initialize from localStorage
    this.initializeFromStorage();

    // Save to storage whenever form data changes
    this.form.valueChanges.subscribe(() => {
      this.saveToStorage();
    });
  }

  private initializeFromStorage(): void {
    const storedData = this.loadFromStorage();
    if (storedData) {
      this.restoreFromStorage(storedData);
    }
  }

  get peopleArray(): FormArray {
    return this.form.get('people') as FormArray;
  }

  startNewDeclaration(): void {
    this.teardownAllPersonSubscriptions();
    this.nextPersonId = 1;
    this.form.setControl('people', this.fb.array([this.createPerson('Selbst')]));
    this.currentPersonIndex.set(0);
    this.highestReachedPersonIndex.set(0);
    this.reviewMode.set(false);
    this.completedPersonIds.set(new Set<string>());
    this.lastSubmission.set(null);
    this.clearStoredData();
  }

  private saveToStorage(): void {
    try {
      const data = {
        formData: this.form.getRawValue(),
        currentPersonIndex: this.currentPersonIndex(),
        highestReachedPersonIndex: this.highestReachedPersonIndex(),
        reviewMode: this.reviewMode(),
        completedPersonIds: Array.from(this.completedPersonIds()),
        nextPersonId: this.nextPersonId,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error);
    }
  }

  private loadFromStorage(): any | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Check if data is not too old (24 hours)
      const age = Date.now() - (data.timestamp || 0);
      if (age > 24 * 60 * 60 * 1000) {
        this.clearStoredData();
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
      this.clearStoredData();
      return null;
    }
  }

  private restoreFromStorage(data: any): void {
    try {
      // Restore form data
      if (data.formData?.people) {
        const peopleArray = this.fb.array(
          data.formData.people.map((personData: any) => this.restorePerson(personData)),
        ) as any;
        this.form.setControl('people', peopleArray);
      }

      // Restore state
      this.currentPersonIndex.set(data.currentPersonIndex || 0);
      this.highestReachedPersonIndex.set(data.highestReachedPersonIndex || 0);
      this.reviewMode.set(data.reviewMode || false);
      this.completedPersonIds.set(new Set(data.completedPersonIds || []));
      this.nextPersonId = data.nextPersonId || 1;

      // Re-setup subscriptions for restored people
      this.peopleArray.controls.forEach((person) => this.connectPerson(person as FormGroup));

      console.log('[HealthDeclarationFormService] Restored form data from localStorage');
    } catch (error) {
      console.warn('Failed to restore form data:', error);
      this.startNewDeclaration();
    }
  }

  private restorePerson(personData: any): FormGroup {
    const person = this.createPerson(personData.profile?.relationship || 'Familienmitglied');

    // Restore profile data
    if (personData.profile) {
      Object.keys(personData.profile).forEach((key) => {
        const control = person.get(`profile.${key}`);
        if (control) {
          control.setValue(personData.profile[key]);
        }
      });
    }

    // Restore body metrics
    if (personData.bodyMetrics) {
      Object.keys(personData.bodyMetrics).forEach((key) => {
        const control = person.get(`bodyMetrics.${key}`);
        if (control) {
          control.setValue(personData.bodyMetrics[key]);
        }
      });
    }

    // Restore dental info
    if (personData.dentalInfo) {
      Object.keys(personData.dentalInfo).forEach((key) => {
        const control = person.get(`dentalInfo.${key}`);
        if (control) {
          control.setValue(personData.dentalInfo[key]);
        }
      });
    }

    // Restore lifestyle
    if (personData.lifestyle) {
      Object.keys(personData.lifestyle).forEach((key) => {
        const control = person.get(`lifestyle.${key}`);
        if (control) {
          control.setValue(personData.lifestyle[key]);
        }
      });
    }

    // Restore medical questions
    if (personData.medicalQuestions) {
      personData.medicalQuestions.forEach((questionData: any, index: number) => {
        if (index < person.get('medicalQuestions')?.value?.length) {
          const questionControl = (person.get('medicalQuestions') as FormArray).at(index);
          if (questionControl) {
            Object.keys(questionData).forEach((key) => {
              const control = questionControl.get(key);
              if (control) {
                control.setValue(questionData[key]);
              }
            });
          }
        }
      });
    }

    // Restore meta
    if (personData.meta) {
      Object.keys(personData.meta).forEach((key) => {
        const control = person.get(`meta.${key}`);
        if (control) {
          control.setValue(personData.meta[key]);
        }
      });
    }

    return person;
  }

  private clearStoredData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear stored data:', error);
    }
  }

  addPerson(): void {
    const relationship = this.peopleArray.length === 0 ? 'Selbst' : 'Familienmitglied';
    this.peopleArray.push(this.createPerson(relationship));
    this.reviewMode.set(false);
    this.saveToStorage();
  }

  removePerson(index: number): void {
    if (this.peopleArray.length <= 1) {
      return;
    }

    const person = this.personAt(index);
    const id = person ? this.personId(person) : null;

    if (id) {
      this.teardownPersonSubscription(id);
    }

    this.peopleArray.removeAt(index);
    this.syncCompletedIdsFromForm();

    const nextCurrentIndex = Math.min(this.currentPersonIndex(), this.peopleArray.length - 1);
    this.currentPersonIndex.set(Math.max(0, nextCurrentIndex));
    this.highestReachedPersonIndex.set(
      Math.min(this.highestReachedPersonIndex(), this.peopleArray.length - 1),
    );

    if (this.peopleArray.length === 0) {
      this.peopleArray.push(this.createPerson('Selbst'));
      this.currentPersonIndex.set(0);
      this.highestReachedPersonIndex.set(0);
    }
  }

  personAt(index: number): FormGroup | null {
    return (this.peopleArray.at(index) as FormGroup | undefined) ?? null;
  }

  personId(person: AbstractControl): string {
    return (person.get('meta.id')?.value as string) ?? '';
  }

  familySetupValid(): boolean {
    return this.peopleArray.controls.every((personControl) =>
      this.personBasicsValid(personControl),
    );
  }

  personBasicsValid(person: AbstractControl): boolean {
    return ['profile.gender', 'profile.birthDate'].every((path) => {
      const control = person.get(path);
      return !!control && control.valid;
    });
  }

  markFamilySetupTouched(): void {
    for (const person of this.peopleArray.controls) {
      person.get('profile.gender')?.markAsTouched();
      person.get('profile.birthDate')?.markAsTouched();
    }
  }

  canVisitPerson(index: number): boolean {
    return index <= this.highestReachedPersonIndex();
  }

  isPersonCompleted(index: number): boolean {
    return !!this.personAt(index)?.get('meta.completed')?.value;
  }

  personStepStatus(index: number): PersonStepStatus {
    if (this.currentPersonIndex() === index && !this.reviewMode()) {
      return 'active';
    }

    return this.isPersonCompleted(index) ? 'completed' : 'inactive';
  }

  visitPerson(index: number): void {
    if (!this.canVisitPerson(index)) {
      return;
    }

    this.currentPersonIndex.set(index);
    this.reviewMode.set(false);
  }

  isQuestionVisible(person: AbstractControl, questionKey: string): boolean {
    if (questionKey === '12a') {
      return false;
    }

    if (questionKey === '11') {
      return person.get('profile.gender')?.value === 'female';
    }

    const gender = (person.get('profile.gender')?.value as PersonGender) ?? '';
    const definition = QUESTION_LOOKUP.get(questionKey);

    if (!definition) {
      return true;
    }

    if (definition.visibility === 'all') {
      if (!definition.dependsOn) {
        return true;
      }
    } else if (gender === 'male') {
      return false;
    }

    if (!definition.dependsOn) {
      return true;
    }

    const parentQuestion = this.questionArray(person).controls.find((question) => {
      return question.get('key')?.value === definition.dependsOn?.questionId;
    });

    return parentQuestion?.get('answer')?.value === definition.dependsOn.answer;
  }

  questionRequiresDetails(questionKey: string): boolean {
    return QUESTION_LOOKUP.get(questionKey)?.opensDiagnosis ?? false;
  }

  finalizeCurrentPerson(): 'invalid' | 'advanced' | 'review' {
    const person = this.personAt(this.currentPersonIndex());

    if (!person) {
      return 'invalid';
    }

    if (person.invalid) {
      person.markAllAsTouched();
      console.warn(
        '[HealthDeclarationFormService] Current person is invalid',
        this.collectInvalidControlPaths(person),
      );
      this.reviewMode.set(false);
      return 'invalid';
    }

    console.log(`[HealthDeclarationFormService] Finalized person ${this.currentPersonIndex() + 1}`);

    person.get('meta.completed')?.setValue(true);
    this.completedPersonIds.update((existing) => {
      const next = new Set(existing);
      next.add(this.personId(person));
      return next;
    });

    this.saveToStorage();

    if (this.currentPersonIndex() < this.peopleArray.length - 1) {
      const nextIndex = this.currentPersonIndex() + 1;
      this.currentPersonIndex.set(nextIndex);
      this.highestReachedPersonIndex.set(Math.max(this.highestReachedPersonIndex(), nextIndex));
      this.reviewMode.set(false);
      return 'advanced';
    }

    const formData = this.form.getRawValue();
    const allPersonsData = formData.people;

    console.log('[HealthDeclarationFormService] All persons finalized - Complete data:');
    console.log(JSON.stringify(allPersonsData, null, 2));

    this.reviewMode.set(true);
    return 'review';
  }

  openReview(): void {
    if (this.allPeopleCompleted()) {
      this.reviewMode.set(true);
    }
  }

  allPeopleCompleted(): boolean {
    return (
      this.peopleArray.length > 0 && this.completedPersonIds().size === this.peopleArray.length
    );
  }

  submitDeclaration(): boolean {
    if (!this.allPeopleCompleted() || this.form.invalid) {
      this.form.markAllAsTouched();
      this.reviewMode.set(false);
      return false;
    }

    const formData = this.form.getRawValue();
    const allPersonsData = formData.people;

    console.log('[HealthDeclarationFormService] Submitting declaration');
    console.log(JSON.stringify({ people: allPersonsData }, null, 2));

    const summary: SubmissionSummary = {
      submittedAt: new Date().toISOString(),
      peopleCount: this.peopleArray.length,
      people: this.peopleArray.controls.map((person, index) => ({
        id: this.personId(person),
        fullName: (person.get('profile.fullName')?.value as string) || `Person ${index + 1}`,
        gender: (person.get('profile.gender')?.value as PersonGender) || '',
        birthDate: (person.get('profile.birthDate')?.value as string) || '',
      })),
    };

    this.lastSubmission.set(summary);
    this.clearStoredData(); // Clear stored data after successful submission
    return true;
  }

  questionArray(person: AbstractControl): FormArray {
    return person.get('medicalQuestions') as FormArray;
  }

  questionDetails(question: AbstractControl): FormArray {
    return question.get('details') as FormArray;
  }

  surgeriesArray(person: AbstractControl): FormArray {
    return person.get('surgeries') as FormArray;
  }

  addDiagnosis(question: AbstractControl): void {
    this.questionDetails(question).push(this.createDiagnosis());
  }

  removeDiagnosis(question: AbstractControl, index: number): void {
    this.questionDetails(question).removeAt(index);
    this.questionDetails(question).markAsDirty();
    this.questionDetails(question).updateValueAndValidity();
  }

  addSurgery(person: AbstractControl): void {
    this.surgeriesArray(person).push(this.createSurgery());
  }

  removeSurgery(person: AbstractControl, index: number): void {
    this.surgeriesArray(person).removeAt(index);
  }

  countAffirmativeAnswers(person: AbstractControl): number {
    return this.questionArray(person).controls.reduce((count, question) => {
      return question.get('answer')?.value === 'yes' ? count + 1 : count;
    }, 0);
  }

  private createPerson(relationship: string): FormGroup {
    const person = this.fb.group({
      meta: this.fb.group({
        id: this.fb.control(this.generatePersonId()),
        completed: this.fb.control(false),
      }),
      profile: this.fb.group(
        {
          fullName: this.fb.control(''),
          gender: this.fb.control<PersonGender>('', Validators.required),
          birthDate: this.fb.control('', [Validators.required, birthYearValidator()]),
          relationship: this.fb.control(relationship, Validators.required),
          email: this.fb.control(''),
          phone: this.fb.control(''),
        },
        { validators: babyAgeValidator() },
      ),
      bodyMetrics: this.fb.group({
        heightCm: this.fb.control('', [
          Validators.required,
          numericRangeValidator(0, 250, 'invalidHeightRange'),
        ]),
        weightKg: this.fb.control('', [
          Validators.required,
          numericRangeValidator(0, 200, 'invalidWeightRange'),
        ]),
      }),
      medicalQuestions: this.fb.array(
        QUESTION_DEFINITIONS.map((definition) => this.createQuestion(definition)),
      ),
      lifestyle: this.fb.group({
        smokeStatus: this.fb.control('none', Validators.required),
        cigarettesPerDay: this.fb.control(''),
        nicotineUse: this.fb.control(false),
        nicotineUnits: this.fb.control(''),
        nicotineFrequency: this.fb.control(''),
        nicotineFrom: this.fb.control(''),
        nicotineTo: this.fb.control(''),
        alcoholUse: this.fb.control(false),
        alcoholUnits: this.fb.control(''),
        alcoholFrequency: this.fb.control(''),
        alcoholFrom: this.fb.control(''),
        alcoholTo: this.fb.control(''),
        drugUse: this.fb.control(false),
        drugUnits: this.fb.control(''),
        drugFrequency: this.fb.control(''),
        drugFrom: this.fb.control(''),
        drugTo: this.fb.control(''),
        sportsActivity: this.fb.control(''),
      }),
      surgeries: this.fb.array([]),
      doctorInfo: this.fb.group({
        practiceName: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        familyName: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        givenNames: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        street: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        streetNumber: this.fb.control('', [
          Validators.required,
          Validators.pattern(STREET_NUMBER_PATTERN),
        ]),
        postalCode: this.fb.control('', [
          Validators.required,
          Validators.pattern(POSTAL_CODE_PATTERN),
        ]),
        city: this.fb.control('', [Validators.required, Validators.minLength(2)]),
      }),
      dentalInfo: this.fb.group({
        desiredLevel: this.fb.control('', Validators.required),
        findingDate: this.fb.control(new Date().toISOString().slice(0, 10), Validators.required),
        toothStatusNotes: this.fb.control(''),
        prosthesesCondition: this.fb.control('', Validators.required),
        prosthesesReason: this.fb.control(''),
        parodontitisBleeding: this.fb.control(''),
        parodontitisRemarks: this.fb.control(''),
        jawDescription: this.fb.control(''),
        angleClass: this.fb.control(''),
        jawExpectedWork: this.fb.control<YesNoAnswer>(''),
        jawReason: this.fb.control(''),
        jawTreatments: this.fb.control(''),
        jawCostEstimate: this.fb.control(''),
        hygiene: this.fb.control('', Validators.required),
        plannedDentalCost: this.fb.control('', Validators.required),
        pregnancyDate: this.fb.control(''),
        pregnancyWeightBefore: this.fb.control('', [
          numericRangeValidator(0, 200, 'invalidWeightRange'),
        ]),
      }),
      declaration: this.fb.group({
        city: this.fb.control(''),
        consent: this.fb.control(false),
      }),
    });

    this.connectPerson(person);
    this.syncDynamicState(person);

    return person;
  }

  private createQuestion(definition: QuestionDefinition): FormGroup {
    return this.fb.group({
      key: this.fb.control(definition.key),
      prompt: this.fb.control(definition.prompt),
      type: this.fb.control(definition.type),
      answer: this.fb.control<YesNoAnswer>('', Validators.required),
      textValue: this.fb.control(''),
      dateValue: this.fb.control(''),
      implantDetails: this.fb.control(''),
      implantStatus: this.fb.control(''),
      details: this.fb.array([]),
    });
  }

  private createDiagnosis(): FormGroup {
    return this.fb.group(
      {
        implantAnswer: this.fb.control<YesNoAnswer>(''),
        implantDetails: this.fb.control(''),
        implantStatus: this.fb.control(''),
        name: this.fb.control(''),
        amountPerDay: this.fb.control(''),
        duration: this.fb.control(''),
        condition: this.fb.control('', [Validators.required, Validators.minLength(5)]),
        from: this.fb.control('', [Validators.required, dateValidator]),
        to: this.fb.control('', dateValidator),
        recovered: this.fb.control<YesNoAnswer>('', Validators.required),
        doctorGivenNames: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        doctorFamilyName: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        doctorStreet: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        doctorStreetNumber: this.fb.control('', [
          Validators.required,
          Validators.pattern(STREET_NUMBER_PATTERN),
        ]),
        doctorPostalCode: this.fb.control('', [
          Validators.required,
          Validators.pattern(POSTAL_CODE_PATTERN),
        ]),
        doctorCity: this.fb.control('', [Validators.required, Validators.minLength(2)]),
        notes: this.fb.control(''),
      },
      { validators: [dateOrderValidator('from', 'to')] },
    );
  }

  private createSurgery(): FormGroup {
    return this.fb.group({
      procedure: this.fb.control('', [Validators.required, Validators.minLength(2)]),
      surgeryDate: this.fb.control('', Validators.required),
      hospital: this.fb.control('', Validators.required),
      doctorName: this.fb.control(''),
      notes: this.fb.control(''),
    });
  }

  private connectPerson(person: FormGroup): void {
    const personId = this.personId(person);
    const subscriptions = [
      person.get('profile.gender')!.valueChanges,
      person.get('lifestyle.smokeStatus')!.valueChanges,
      person.get('lifestyle.nicotineUse')!.valueChanges,
      person.get('lifestyle.alcoholUse')!.valueChanges,
      person.get('lifestyle.drugUse')!.valueChanges,
      ...this.questionArray(person).controls.map(
        (question) => question.get('answer')!.valueChanges,
      ),
    ];

    this.subscriptions.set(
      personId,
      merge(...subscriptions).subscribe(() => {
        this.syncDynamicState(person);
      }),
    );
  }

  private syncDynamicState(person: FormGroup): void {
    const gender = (person.get('profile.gender')?.value as PersonGender) ?? '';
    const dentalInfo = person.get('dentalInfo') as FormGroup | null;
    const operationQuestion = this.questionArray(person).controls.find((question) => {
      return question.get('key')?.value === '8';
    }) as FormGroup | undefined;

    for (const questionControl of this.questionArray(person).controls) {
      const question = questionControl as FormGroup;
      const questionKey = (question.get('key')?.value as string) ?? '';
      const definition = QUESTION_LOOKUP.get(questionKey);
      const answerControl = question.get('answer');
      const textControl = question.get('textValue');
      const dateControl = question.get('dateValue');
      const implantDetailsControl = question.get('implantDetails');
      const implantStatusControl = question.get('implantStatus');
      const detailsArray = this.questionDetails(question);

      if (
        !definition ||
        !answerControl ||
        !textControl ||
        !dateControl ||
        !implantDetailsControl ||
        !implantStatusControl
      ) {
        continue;
      }

      if (!this.isQuestionVisible(person, questionKey)) {
        question.disable({ emitEvent: false });
        answerControl.setValue('', { emitEvent: false });
        textControl.setValue('', { emitEvent: false });
        dateControl.setValue('', { emitEvent: false });
        implantDetailsControl.setValue('', { emitEvent: false });
        implantStatusControl.setValue('', { emitEvent: false });
        textControl.clearValidators();
        dateControl.clearValidators();
        implantDetailsControl.clearValidators();
        implantStatusControl.clearValidators();
        this.clearArray(detailsArray);
        detailsArray.clearValidators();
        detailsArray.updateValueAndValidity({ emitEvent: false });
        continue;
      }

      question.enable({ emitEvent: false });
      answerControl.clearValidators();
      textControl.clearValidators();
      dateControl.clearValidators();
      implantDetailsControl.clearValidators();
      implantStatusControl.clearValidators();

      if (questionKey === '7') {
        question.disable({ emitEvent: false });
        answerControl.setValue('', { emitEvent: false });
        textControl.setValue('', { emitEvent: false });
        dateControl.setValue('', { emitEvent: false });
        implantDetailsControl.setValue('', { emitEvent: false });
        implantStatusControl.setValue('', { emitEvent: false });
        this.clearArray(detailsArray);
        detailsArray.clearValidators();
        answerControl.clearValidators();
        textControl.clearValidators();
        dateControl.clearValidators();
        implantDetailsControl.clearValidators();
        implantStatusControl.clearValidators();
        answerControl.updateValueAndValidity({ emitEvent: false });
        textControl.updateValueAndValidity({ emitEvent: false });
        dateControl.updateValueAndValidity({ emitEvent: false });
        implantDetailsControl.updateValueAndValidity({ emitEvent: false });
        implantStatusControl.updateValueAndValidity({ emitEvent: false });
        detailsArray.updateValueAndValidity({ emitEvent: false });
        continue;
      }

      if (definition.type === 'yes_no' || definition.type === 'yes_no_with_details') {
        answerControl.setValidators([Validators.required]);
      }

      if (
        (definition.type === 'yes_no' || definition.type === 'yes_no_with_details') &&
        answerControl.value === 'yes'
      ) {
        if (definition.opensDiagnosis) {
          detailsArray.setValidators([minItemsValidator(1)]);
          textControl.clearValidators();
          dateControl.clearValidators();

          if (detailsArray.length === 0) {
            detailsArray.push(this.createDiagnosis());
          }

          if (questionKey === '8') {
            for (const detailControl of detailsArray.controls) {
              const detail = detailControl as FormGroup;
              detail.get('name')?.setValue('', { emitEvent: false });
              detail.get('amountPerDay')?.setValue('', { emitEvent: false });
              detail.get('duration')?.setValue('', { emitEvent: false });
              detail.get('name')?.clearValidators();
              detail.get('amountPerDay')?.clearValidators();
              detail.get('duration')?.clearValidators();
              const implantAnswer = detail.get('implantAnswer');
              const detailImplantDetails = detail.get('implantDetails');
              const detailImplantStatus = detail.get('implantStatus');

              implantAnswer?.setValidators([Validators.required]);

              detailImplantDetails?.clearValidators();
              detailImplantStatus?.clearValidators();

              if (implantAnswer?.value !== 'yes') {
                detailImplantDetails?.setValue('', { emitEvent: false });
                detailImplantStatus?.setValue('', { emitEvent: false });
              }

              implantAnswer?.updateValueAndValidity({ emitEvent: false });
              detail.get('name')?.updateValueAndValidity({ emitEvent: false });
              detail.get('amountPerDay')?.updateValueAndValidity({ emitEvent: false });
              detail.get('duration')?.updateValueAndValidity({ emitEvent: false });
              detailImplantDetails?.updateValueAndValidity({ emitEvent: false });
              detailImplantStatus?.updateValueAndValidity({ emitEvent: false });
            }
          } else if (questionKey === '12') {
            for (const detailControl of detailsArray.controls) {
              const detail = detailControl as FormGroup;
              detail.get('name')?.setValidators([Validators.required, Validators.minLength(2)]);
              detail
                .get('amountPerDay')
                ?.setValidators([Validators.required, Validators.minLength(1)]);
              detail.get('duration')?.setValidators([Validators.required, Validators.minLength(1)]);
              detail.get('implantAnswer')?.setValue('', { emitEvent: false });
              detail.get('implantDetails')?.setValue('', { emitEvent: false });
              detail.get('implantStatus')?.setValue('', { emitEvent: false });
              detail.get('implantAnswer')?.clearValidators();
              detail.get('implantDetails')?.clearValidators();
              detail.get('implantStatus')?.clearValidators();
              detail.get('name')?.updateValueAndValidity({ emitEvent: false });
              detail.get('amountPerDay')?.updateValueAndValidity({ emitEvent: false });
              detail.get('duration')?.updateValueAndValidity({ emitEvent: false });
              detail.get('implantAnswer')?.updateValueAndValidity({ emitEvent: false });
              detail.get('implantDetails')?.updateValueAndValidity({ emitEvent: false });
              detail.get('implantStatus')?.updateValueAndValidity({ emitEvent: false });
            }
          } else {
            for (const detailControl of detailsArray.controls) {
              const detail = detailControl as FormGroup;
              detail.get('name')?.setValue('', { emitEvent: false });
              detail.get('amountPerDay')?.setValue('', { emitEvent: false });
              detail.get('duration')?.setValue('', { emitEvent: false });
              detail.get('name')?.clearValidators();
              detail.get('amountPerDay')?.clearValidators();
              detail.get('duration')?.clearValidators();
              detail.get('implantAnswer')?.setValue('', { emitEvent: false });
              detail.get('implantDetails')?.setValue('', { emitEvent: false });
              detail.get('implantStatus')?.setValue('', { emitEvent: false });
              detail.get('implantAnswer')?.clearValidators();
              detail.get('implantDetails')?.clearValidators();
              detail.get('implantStatus')?.clearValidators();
              detail.get('name')?.updateValueAndValidity({ emitEvent: false });
              detail.get('amountPerDay')?.updateValueAndValidity({ emitEvent: false });
              detail.get('duration')?.updateValueAndValidity({ emitEvent: false });
              detail.get('implantAnswer')?.updateValueAndValidity({ emitEvent: false });
              detail.get('implantDetails')?.updateValueAndValidity({ emitEvent: false });
              detail.get('implantStatus')?.updateValueAndValidity({ emitEvent: false });
            }
          }
        } else if (definition.type === 'yes_no_with_details') {
          textControl.setValidators([Validators.required, Validators.minLength(6)]);
          dateControl.clearValidators();
          this.clearArray(detailsArray);
          detailsArray.clearValidators();
        }
      } else if (definition.type === 'text') {
        if (definition.dependsOn) {
          textControl.setValidators([Validators.required, Validators.minLength(2)]);
        }
        this.clearArray(detailsArray);
        detailsArray.clearValidators();
      } else if (definition.type === 'date') {
        if (definition.dependsOn) {
          dateControl.setValidators([Validators.required]);
        }
        this.clearArray(detailsArray);
        detailsArray.clearValidators();
      } else {
        textControl.setValue('', { emitEvent: false });
        dateControl.setValue('', { emitEvent: false });
        this.clearArray(detailsArray);
        detailsArray.clearValidators();
      }

      answerControl.updateValueAndValidity({ emitEvent: false });
      textControl.updateValueAndValidity({ emitEvent: false });
      dateControl.updateValueAndValidity({ emitEvent: false });
      implantDetailsControl.updateValueAndValidity({ emitEvent: false });
      implantStatusControl.updateValueAndValidity({ emitEvent: false });
      detailsArray.updateValueAndValidity({ emitEvent: false });
    }

    const smokeStatus = person.get('lifestyle.smokeStatus');
    const cigarettesPerDay = person.get('lifestyle.cigarettesPerDay');
    const nicotineUse = person.get('lifestyle.nicotineUse');
    const nicotineUnits = person.get('lifestyle.nicotineUnits');
    const nicotineFrequency = person.get('lifestyle.nicotineFrequency');
    const nicotineFrom = person.get('lifestyle.nicotineFrom');
    const nicotineTo = person.get('lifestyle.nicotineTo');
    const alcoholUse = person.get('lifestyle.alcoholUse');
    const alcoholUnits = person.get('lifestyle.alcoholUnits');
    const alcoholFrequency = person.get('lifestyle.alcoholFrequency');
    const alcoholFrom = person.get('lifestyle.alcoholFrom');
    const alcoholTo = person.get('lifestyle.alcoholTo');
    const drugUse = person.get('lifestyle.drugUse');
    const drugUnits = person.get('lifestyle.drugUnits');
    const drugFrequency = person.get('lifestyle.drugFrequency');
    const drugFrom = person.get('lifestyle.drugFrom');
    const drugTo = person.get('lifestyle.drugTo');
    const question11 = this.questionArray(person).controls.find((question) => {
      return question.get('key')?.value === '11';
    }) as FormGroup | undefined;
    const question13 = this.questionArray(person).controls.find((question) => {
      return question.get('key')?.value === '13';
    }) as FormGroup | undefined;
    const question16 = this.questionArray(person).controls.find((question) => {
      return question.get('key')?.value === '16';
    }) as FormGroup | undefined;
    const question17 = this.questionArray(person).controls.find((question) => {
      return question.get('key')?.value === '17';
    }) as FormGroup | undefined;

    if (smokeStatus && cigarettesPerDay) {
      if (smokeStatus.value === 'daily' || smokeStatus.value === 'occasional') {
        cigarettesPerDay.setValidators([Validators.required, Validators.pattern(/^\d+$/)]);
      } else {
        cigarettesPerDay.setValue('', { emitEvent: false });
        cigarettesPerDay.clearValidators();
      }

      cigarettesPerDay.updateValueAndValidity({ emitEvent: false });
    }

    const question13Enabled = question13?.get('answer')?.value === 'yes';
    const syncSubstanceFields = (
      useControl: AbstractControl | null,
      unitsControl: AbstractControl | null,
      frequencyControl: AbstractControl | null,
      fromControl: AbstractControl | null,
      toControl: AbstractControl | null,
    ): void => {
      unitsControl?.clearValidators();
      frequencyControl?.clearValidators();
      fromControl?.clearValidators();
      toControl?.clearValidators();

      if (!question13Enabled) {
        useControl?.setValue(false, { emitEvent: false });
        unitsControl?.setValue('', { emitEvent: false });
        frequencyControl?.setValue('', { emitEvent: false });
        fromControl?.setValue('', { emitEvent: false });
        toControl?.setValue('', { emitEvent: false });
      } else if (useControl?.value === true) {
        unitsControl?.setValidators([Validators.required, Validators.minLength(1)]);
        frequencyControl?.setValidators([Validators.required, Validators.minLength(1)]);
      } else {
        unitsControl?.setValue('', { emitEvent: false });
        frequencyControl?.setValue('', { emitEvent: false });
        fromControl?.setValue('', { emitEvent: false });
        toControl?.setValue('', { emitEvent: false });
      }

      useControl?.updateValueAndValidity({ emitEvent: false });
      unitsControl?.updateValueAndValidity({ emitEvent: false });
      frequencyControl?.updateValueAndValidity({ emitEvent: false });
      fromControl?.updateValueAndValidity({ emitEvent: false });
      toControl?.updateValueAndValidity({ emitEvent: false });
    };

    syncSubstanceFields(nicotineUse, nicotineUnits, nicotineFrequency, nicotineFrom, nicotineTo);
    syncSubstanceFields(alcoholUse, alcoholUnits, alcoholFrequency, alcoholFrom, alcoholTo);
    syncSubstanceFields(drugUse, drugUnits, drugFrequency, drugFrom, drugTo);

    if (dentalInfo) {
      const pregnancyDate = dentalInfo.get('pregnancyDate');
      const pregnancyWeightBefore = dentalInfo.get('pregnancyWeightBefore');
      const prosthesesReason = dentalInfo.get('prosthesesReason');
      const prosthesesCondition = dentalInfo.get('prosthesesCondition');
      const parodontitisBleeding = dentalInfo.get('parodontitisBleeding');
      const parodontitisRemarks = dentalInfo.get('parodontitisRemarks');
      const jawDescription = dentalInfo.get('jawDescription');
      const angleClass = dentalInfo.get('angleClass');
      const jawExpectedWork = dentalInfo.get('jawExpectedWork');
      const jawReason = dentalInfo.get('jawReason');
      const jawTreatments = dentalInfo.get('jawTreatments');
      const jawCostEstimate = dentalInfo.get('jawCostEstimate');

      prosthesesReason?.clearValidators();
      parodontitisBleeding?.clearValidators();
      parodontitisRemarks?.clearValidators();
      jawDescription?.clearValidators();
      angleClass?.clearValidators();
      jawExpectedWork?.clearValidators();
      jawReason?.clearValidators();
      jawTreatments?.clearValidators();
      jawCostEstimate?.clearValidators();
      pregnancyDate?.clearValidators();
      pregnancyWeightBefore?.setValidators([numericRangeValidator(0, 200, 'invalidWeightRange')]);

      if (prosthesesCondition?.value === 'Mittel' || prosthesesCondition?.value === 'Schlecht') {
        prosthesesReason?.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        prosthesesReason?.setValue('', { emitEvent: false });
      }

      if (question16?.get('answer')?.value === 'yes') {
        parodontitisBleeding?.setValidators([Validators.required]);
        parodontitisRemarks?.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        parodontitisBleeding?.setValue('', { emitEvent: false });
        parodontitisRemarks?.setValue('', { emitEvent: false });
      }

      if (question17?.get('answer')?.value === 'yes') {
        jawDescription?.setValidators([Validators.required, Validators.minLength(2)]);
        angleClass?.setValidators([Validators.required, Validators.minLength(1)]);
        jawExpectedWork?.setValidators([Validators.required]);

        if (jawExpectedWork?.value === 'yes') {
          jawReason?.setValidators([Validators.required, Validators.minLength(2)]);
          jawTreatments?.setValidators([Validators.required, Validators.minLength(2)]);
          jawCostEstimate?.setValidators([Validators.required]);
        } else {
          jawReason?.setValue('', { emitEvent: false });
          jawTreatments?.setValue('', { emitEvent: false });
          jawCostEstimate?.setValue('', { emitEvent: false });
        }
      } else {
        jawDescription?.setValue('', { emitEvent: false });
        angleClass?.setValue('', { emitEvent: false });
        jawExpectedWork?.setValue('', { emitEvent: false });
        jawReason?.setValue('', { emitEvent: false });
        jawTreatments?.setValue('', { emitEvent: false });
        jawCostEstimate?.setValue('', { emitEvent: false });
      }

      if (question11?.get('answer')?.value === 'yes') {
        pregnancyDate?.setValidators([Validators.required]);
        pregnancyWeightBefore?.addValidators([Validators.required]);
      } else {
        pregnancyDate?.setValue('', { emitEvent: false });
        pregnancyWeightBefore?.setValue('', { emitEvent: false });
      }

      prosthesesReason?.updateValueAndValidity({ emitEvent: false });
      parodontitisBleeding?.updateValueAndValidity({ emitEvent: false });
      parodontitisRemarks?.updateValueAndValidity({ emitEvent: false });
      jawDescription?.updateValueAndValidity({ emitEvent: false });
      angleClass?.updateValueAndValidity({ emitEvent: false });
      jawExpectedWork?.updateValueAndValidity({ emitEvent: false });
      jawReason?.updateValueAndValidity({ emitEvent: false });
      jawTreatments?.updateValueAndValidity({ emitEvent: false });
      jawCostEstimate?.updateValueAndValidity({ emitEvent: false });
      pregnancyDate?.updateValueAndValidity({ emitEvent: false });
      pregnancyWeightBefore?.updateValueAndValidity({ emitEvent: false });
    }

    if (gender === 'male') {
      person.get('medicalQuestions')?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private clearArray(array: FormArray): void {
    array.clear({ emitEvent: false });
  }

  private logCurrentState(context: string): void {
    const formData = this.form.getRawValue();

    console.log(`[HealthDeclarationFormService] ${context}`);
    console.log(JSON.stringify(formData, null, 2));
  }

  private collectInvalidControlPaths(control: AbstractControl, path = ''): string[] {
    if (control instanceof FormGroup) {
      return Object.entries(control.controls).flatMap(([key, child]) =>
        this.collectInvalidControlPaths(child, path ? `${path}.${key}` : key),
      );
    }

    if (control instanceof FormArray) {
      return control.controls.flatMap((child, index) =>
        this.collectInvalidControlPaths(child, `${path}[${index}]`),
      );
    }

    return control.invalid ? [path] : [];
  }

  private generatePersonId(): string {
    const id = `person-${this.nextPersonId}`;
    this.nextPersonId += 1;
    return id;
  }

  private syncCompletedIdsFromForm(): void {
    const next = new Set<string>();

    for (const person of this.peopleArray.controls) {
      if (person.get('meta.completed')?.value) {
        next.add(this.personId(person));
      }
    }

    this.completedPersonIds.set(next);
  }

  private teardownPersonSubscription(personId: string): void {
    this.subscriptions.get(personId)?.unsubscribe();
    this.subscriptions.delete(personId);
  }

  private teardownAllPersonSubscriptions(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }

    this.subscriptions.clear();
  }
}
