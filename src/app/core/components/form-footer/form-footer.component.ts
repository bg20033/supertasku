import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-form-footer',
  imports: [MatIconModule, RouterLink],
  templateUrl: './form-footer.component.html',
  styleUrl: './form-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFooterComponent {
  @Input() backDisabled = false;
  @Input() nextDisabled = false;
  @Input() nextLabel = 'Next';
  @Input() routerLink?: any[];
  @Input() backRouterLink?: any[];

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() chat = new EventEmitter<void>();
  @Output() voice = new EventEmitter<void>();

  protected handleBack(): void {
    this.back.emit();
  }

  protected handleNext(): void {
    this.next.emit();
  }

  protected handleChat(): void {
    this.chat.emit();
  }

  protected handleVoice(): void {
    this.voice.emit();
  }
}
