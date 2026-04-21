import { Routes } from '@angular/router';
import { FamilySetupView } from './features/family-setup/family-setup.component';
import { HealthFormViewView } from './features/health-form-view/health-form.component';
import { LandingPageView } from './features/landing-page/landing-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageView,
    title: 'Gesundheitsdeklaration starten',
  },
  {
    path: 'family',
    component: FamilySetupView,
    title: 'Familie erfassen',
  },
  {
    path: 'health',
    component: HealthFormViewView,
    title: 'Gesundheitsdeklaration',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
