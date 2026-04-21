import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

import {
  HealthDeclarationFormService,
  PersonGender,
} from '../../core/services/health-declaration-form.service';
import { FormFooterComponent } from '../../core/components/form-footer/form-footer.component';
import { LocationService, LocationFilterResponse } from '../../core/services/location.service';
import {
  BabyAgeValidationPipe,
  BirthYearValidationPipe,
  RequiredValidationPipe,
} from '../../core/pipes';

@Component({
  selector: 'app-family-setup',
  imports: [
    ReactiveFormsModule,
    FormFooterComponent,
    BirthYearValidationPipe,
    BabyAgeValidationPipe,
    RequiredValidationPipe,
  ],
  templateUrl: './family-setup.component.html',
  styleUrl: './family-setup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilySetupView {
  protected readonly declaration = inject(HealthDeclarationFormService);
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationService);
  protected searchQuery = signal<string>('');
  protected selectedLocationId = signal<number | null>(null);
  protected selectedLocationData = signal<LocationFilterResponse | null>(null);
  protected isDropdownOpen = signal<boolean>(false);
  protected isLoading = signal<boolean>(false);
  protected locationResults = signal<LocationFilterResponse[]>([]);
  private searchSubject = new Subject<string>();
  protected readonly genderOptions: ReadonlyArray<{
    value: Exclude<PersonGender, ''>;
    label: string;
  }> = [
    { value: 'female', label: 'Weiblich' },
    { value: 'male', label: 'Maennlich' },
    { value: 'baby', label: 'Baby' },
  ];

  protected readonly setupSteps = [
    { number: 1, label: 'Personalien', active: true },
    { number: 2, label: 'Beratung', active: false },
    { number: 3, label: 'Formalitaeten', active: false },
    { number: 4, label: 'Abschluss', active: false },
  ] as const;

  private readonly editingPersonIndex = signal<number | null>(0);
  private readonly currentYear = new Date().getFullYear();
  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 2) {
            this.locationResults.set([]);
            this.isLoading.set(false);
            return of([]);
          }
          this.isLoading.set(true);
          return this.searchLocations(query);
        }),
        catchError((err) => {
          console.error('Location search error:', err);
          this.isLoading.set(false);
          return of([]);
        }),
      )
      .subscribe((results) => {
        this.locationResults.set(results);
        this.isDropdownOpen.set(results.length > 0);
        this.isLoading.set(false);
      });
  }

  private searchLocations(query: string) {
    return this.locationService.searchLocations(query);
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value.trim()) {
      this.clearSelection();
      return;
    }

    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  protected selectLocation(location: LocationFilterResponse): void {
    this.selectedLocationId.set(location.locationId);
    this.selectedLocationData.set(location);
    this.searchQuery.set(`${location.zipCode} ${location.locationName}, ${location.cantonName}`);
    this.isDropdownOpen.set(false);
    this.locationResults.set([]);
  }

  protected clearSelection(): void {
    this.selectedLocationId.set(null);
    this.selectedLocationData.set(null);
    this.searchQuery.set('');
    this.locationResults.set([]);
    this.isDropdownOpen.set(false);
  }

  protected filteredLocations(): LocationFilterResponse[] {
    return this.locationResults();
  }

  protected get people(): FormArray {
    return this.declaration.peopleArray;
  }

  protected addPerson(): void {
    this.declaration.addPerson();
    this.editingPersonIndex.set(this.people.length - 1);
  }

  protected removePerson(index: number): void {
    this.declaration.removePerson(index);
    const editingIndex = this.editingPersonIndex();
    if (editingIndex === null) return;
    if (editingIndex === index) {
      this.editingPersonIndex.set(null);
    } else if (editingIndex > index) {
      this.editingPersonIndex.set(editingIndex - 1);
    }
  }

  protected startQuestionnaire(): void {
    if (!this.isLocationSelected()) {
      return;
    }

    if (!this.declaration.familySetupValid()) {
      this.declaration.markFamilySetupTouched();
      return;
    }
    this.declaration.visitPerson(0);
    this.router.navigate(['/health']);
  }

  protected isLocationSelected(): boolean {
    return this.selectedLocationId() !== null && this.selectedLocationData() !== null;
  }

  protected profileGroup(person: AbstractControl): FormGroup {
    return person.get('profile') as FormGroup;
  }

  protected isEditing(index: number, person: AbstractControl): boolean {
    return this.editingPersonIndex() === index || !this.isPersonComplete(person);
  }

  protected editPerson(index: number): void {
    this.editingPersonIndex.set(index);
  }

  protected handleProfileDraftChange(index: number): void {
    const group = this.profileGroup(this.people.at(index));
    if (group.invalid) return;
    this.editingPersonIndex.set(null);
  }

  protected isPersonComplete(person: AbstractControl): boolean {
    return this.profileGroup(person).valid;
  }

  protected birthYearDisplay(person: AbstractControl): string {
    const value = this.profileGroup(person).get('birthDate')?.value;
    return typeof value === 'string' && value.trim() ? value.trim() : 'JJJJ';
  }

  protected avatarSrc(person: AbstractControl): string {
    const profile = this.profileGroup(person);
    const gender = (profile.get('gender')?.value as PersonGender) ?? '';
    const rawYear = profile.get('birthDate')?.value;
    const year =
      typeof rawYear === 'string' && /^\d{4}$/.test(rawYear.trim()) ? Number(rawYear.trim()) : null;
    const age = year === null ? null : this.currentYear - year;

    if (gender === 'baby' || (age !== null && age < 4)) {
      return 'assets/babyIcon.png';
    }
    if (age !== null && age < 18) {
      return gender === 'female' ? 'assets/avatar_kid_4.png' : 'assets/avatar_kid_3.png';
    }
    if (age !== null && age > 19 && age < 60) {
      return gender === 'female' ? 'assets/avatar_adult_4.png' : 'assets/avatar_adult_3.png';
    }
    if (age !== null && age >= 60) {
      return gender === 'female' ? 'assets/avatar_elder_4.png' : 'assets/avatar_elder_3.png';
    }
    return 'assets/avatar_user.svg';
  }

  protected avatarAlt(person: AbstractControl): string {
    const gender = (this.profileGroup(person).get('gender')?.value as PersonGender) ?? '';
    switch (gender) {
      case 'female':
        return 'Avatar weibliche Person';
      case 'male':
        return 'Avatar maennliche Person';
      case 'baby':
        return 'Avatar Baby';
      default:
        return 'Avatar Person';
    }
  }

  protected hasError(control: AbstractControl | null, errorCode?: string): boolean {
    if (!control) return false;
    if (!control.invalid || !(control.touched || control.dirty)) return false;
    return errorCode ? control.hasError(errorCode) : true;
  }

  protected readonly trackByPerson = (_index: number, person: AbstractControl): string => {
    return this.declaration.personId(person);
  };

  protected onBlur(): void {
    setTimeout(() => this.isDropdownOpen.set(false), 200);
  }

  protected onFocus(): void {
    if (this.locationResults().length > 0 && this.searchQuery().length >= 2) {
      this.isDropdownOpen.set(true);
    }
  }

  protected isFamilySetupValid(): boolean {
    return this.declaration.familySetupValid() && this.isLocationSelected();
  }
}
