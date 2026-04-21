import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FamilySetupView } from './family-setup.component';

describe('FamilySetupView', () => {
  let fixture: ComponentFixture<FamilySetupView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilySetupView],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilySetupView);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should add another family member', async () => {
    (fixture.componentInstance as any).addPerson();
    await fixture.whenStable();
    expect((fixture.componentInstance as any).people.length).toBe(2);
  });

  it('should render gender buttons and a birth year field without a name input', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('input[formcontrolname="fullName"]')).toBeNull();
    expect(compiled.querySelectorAll('input[formcontrolname="gender"]').length).toBe(3);
    expect(
      compiled.querySelector('input[formcontrolname="birthDate"]')?.getAttribute('maxlength'),
    ).toBe('4');
  });
});
