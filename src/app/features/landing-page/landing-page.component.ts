import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { HealthDeclarationFormService } from '../../core/services/health-declaration-form.service';
import { FormFooterComponent } from '../../core/components/form-footer/form-footer.component';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, MatIconModule, FormFooterComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageView {
  private readonly declaration = inject(HealthDeclarationFormService);

  protected readonly introParagraphs = [
    'Damit wir auf Ihren Antrag individuell eingehen können, sind wir auf vollständige und detaillierte Beschreibungen angewiesen.',
    'Bitte nutzen Sie dazu auch die jeweiligen Bemerkungsfelder. Jeder der nachfolgenden Fragen muss von der zu versichernden Person oder vom gesetzlichen Vertre- ter persönlich und wahrheitsgetreu beantwortet werden.',
    'Unvollständige oder falsche Angaben gelten als Anzeigepflichtverletzung. Als Folge kann eine Kündigung des Vertrags oder ein Leis- tungsausschluss ausgesprochen werden.',
    'Helsana wird Ihre Daten vertraulich behandeln und nicht an Dritte weitergeben. Bitte lassen Sie keine Bemerkungsfelder leer.',
  ];

  protected startDeclaration(): void {
    this.declaration.startNewDeclaration();
  }
}
