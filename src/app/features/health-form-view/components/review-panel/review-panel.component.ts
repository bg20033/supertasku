import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-panel',
  templateUrl: './review-panel.component.html',
  styleUrls: ['./review-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPanel {
  //private readonly declarationService = inject(HealthDeclarationFormService);
  private readonly router = inject(Router);

  // ngOnInit(): void {
  //   //const submissionData = this.declarationService.getSubmissionData(); 
  //   console.log('✅ Health declaration submitted successfully:', submissionData);
  // }

  goToStart(): void {
    this.router.navigate(['/']);
  }
}
