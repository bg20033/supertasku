import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  HealthDeclarationFormService,
  PersonStepStatus,
} from '../../../../core/services/health-declaration-form.service';
import { startWith } from 'rxjs';

interface PersonTabViewModel {
  id: string;
  index: number;
  label: string;
  state: PersonStepStatus;
  canOpen: boolean;
  completed: boolean;
  avatarSrc: string;
}

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, NgOptimizedImage, MatIconModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  protected readonly declaration = inject(HealthDeclarationFormService);
  private readonly formSnapshot = toSignal(
    this.declaration.form.valueChanges.pipe(startWith(this.declaration.form.getRawValue())),
    { initialValue: this.declaration.form.getRawValue() },
  );

  private readonly currentYear = new Date().getFullYear();

  protected readonly personTabs = computed<PersonTabViewModel[]>(() => {
    this.formSnapshot();

    return this.declaration.peopleArray.controls.map((person, index) => {
      return {
        id: this.declaration.personId(person),
        index,
        label: this.birthYearLabel(person),
        state: this.declaration.personStepStatus(index),
        canOpen: this.declaration.canVisitPerson(index),
        completed: this.declaration.isPersonCompleted(index),
        avatarSrc: this.avatarSrc(person),
      };
    });
  });

  protected visitPerson(index: number): void {
    this.declaration.visitPerson(index);
  }

  protected readonly trackByTab = (_index: number, tab: PersonTabViewModel): string => {
    return tab.id;
  };

  private text(control: AbstractControl, path: string): string {
    const value = control.get(path)?.value;
    return typeof value === 'string' ? value : '';
  }

  private birthYearLabel(person: AbstractControl): string {
    const birthDate = this.text(person, 'profile.birthDate');
    if (/^\d{4}$/.test(birthDate.trim())) {
      return birthDate.trim();
    }
    return 'JJJJ';
  }

  private avatarSrc(person: AbstractControl): string {
    const gender = (person.get('profile.gender')?.value as string) ?? '';
    const rawYear = person.get('profile.birthDate')?.value;
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
}
