import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HealthDeclarationFormService } from '../../core/services/health-declaration-form.service';
import { FormFooterComponent } from '../../core/components/form-footer/form-footer.component';
import { HealthFormViewView } from './health-form.component';

describe('HealthFormViewView', () => {
  let fixture: ComponentFixture<HealthFormViewView>;
  let service: HealthDeclarationFormService;

  const fillMinimalValidPerson = (): void => {
    const person = service.personAt(0)!;

    person.get('profile.fullName')?.setValue('Max Muster');
    person.get('profile.gender')?.setValue('male');
    person.get('profile.birthDate')?.setValue('1990');

    person.get('bodyMetrics.heightCm')?.setValue('177');
    person.get('bodyMetrics.weightKg')?.setValue('68');

    person.get('doctorInfo.practiceName')?.setValue('Praxis Muster');
    person.get('doctorInfo.familyName')?.setValue('Hausarzt');
    person.get('doctorInfo.givenNames')?.setValue('Maria');
    person.get('doctorInfo.street')?.setValue('Bahnhofstrasse');
    person.get('doctorInfo.streetNumber')?.setValue('12');
    person.get('doctorInfo.postalCode')?.setValue('8001');
    person.get('doctorInfo.city')?.setValue('Zurich');

    person.get('dentalInfo.desiredLevel')?.setValue("Bis CHF 1'000.-");
    person.get('dentalInfo.prosthesesCondition')?.setValue('Gut');
    person.get('dentalInfo.hygiene')?.setValue('Gut');
    person.get('dentalInfo.plannedDentalCost')?.setValue("Bis CHF 1'000.-");

    for (const question of service.questionArray(person).controls) {
      if (!question.enabled) {
        continue;
      }

      const type = question.get('type')?.value;
      if (type === 'yes_no' || type === 'yes_no_with_details') {
        question.get('answer')?.setValue('no');
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthFormViewView],
      providers: [provideRouter([])],
    }).compileComponents();

    service = TestBed.inject(HealthDeclarationFormService);
    const person = service.personAt(0)!;
    person.get('profile.fullName')?.setValue('Max Muster');
    person.get('profile.gender')?.setValue('male');
    person.get('profile.birthDate')?.setValue('1990');

    fixture = TestBed.createComponent(HealthFormViewView);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should hide pregnancy questions for male persons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Schwangerschaft');
  });

  it('should not show the pregnancy question for baby profiles', () => {
    const person = service.personAt(0)!;

    person.get('profile.gender')?.setValue('baby');

    expect(service.isQuestionVisible(person, '11')).toBe(false);
  });

  it('should render the questionnaire blocks without the old declaration section', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Name und Adresse des Arztes');
    expect(compiled.textContent).toContain('Gewuenschte Stufe DENTA');
    expect(compiled.textContent).not.toContain('Erklaerung');
  });

  it('should only require medication-specific detail fields for question 12', () => {
    const person = service.personAt(0)!;
    const question4 = service
      .questionArray(person)
      .controls.find((question: AbstractControl) => question.get('key')?.value === '4');
    const question12 = service
      .questionArray(person)
      .controls.find((question: AbstractControl) => question.get('key')?.value === '12');

    expect(question4).toBeTruthy();
    expect(question12).toBeTruthy();

    question4!.get('answer')?.setValue('yes');
    question12!.get('answer')?.setValue('yes');

    const question4Detail = service.questionDetails(question4!).at(0);
    const question12Detail = service.questionDetails(question12!).at(0);

    question4Detail.get('name')?.updateValueAndValidity();
    question4Detail.get('amountPerDay')?.updateValueAndValidity();
    question4Detail.get('duration')?.updateValueAndValidity();
    question12Detail.get('name')?.updateValueAndValidity();
    question12Detail.get('amountPerDay')?.updateValueAndValidity();
    question12Detail.get('duration')?.updateValueAndValidity();

    expect(question4Detail.get('name')?.errors).toBeNull();
    expect(question4Detail.get('amountPerDay')?.errors).toBeNull();
    expect(question4Detail.get('duration')?.errors).toBeNull();

    expect(question12Detail.get('name')?.hasError('required')).toBe(true);
    expect(question12Detail.get('amountPerDay')?.hasError('required')).toBe(true);
    expect(question12Detail.get('duration')?.hasError('required')).toBe(true);
  });

  it('should not attach a success router link to the next-person footer action', () => {
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.directive(FormFooterComponent))
      .componentInstance as FormFooterComponent;

    expect(footer.routerLink).toBeUndefined();
  });

  it('should unlock the footer and advance to the next person once the current one is valid', async () => {
    service.addPerson();
    fixture.detectChanges();

    fillMinimalValidPerson();

    await fixture.whenStable();

    const footer = fixture.debugElement.query(By.directive(FormFooterComponent))
      .componentInstance as FormFooterComponent;

    expect(service.personAt(0)?.valid).toBe(true);
    expect(footer.nextDisabled).toBe(false);

    footer.next.emit();
    await fixture.whenStable();
    fixture.detectChanges();

    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[data-person-tab]'),
    ) as HTMLButtonElement[];

    expect(service.currentPersonIndex()).toBe(1);
    expect(tabs[1].disabled).toBe(false);
  });
});
