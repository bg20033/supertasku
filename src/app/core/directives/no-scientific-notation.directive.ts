import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[type=number]',
  standalone: true,
})
export class NoScientificNotationDirective {
  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  @HostListener('beforeinput', ['$event'])
  protected onBeforeInput(event: InputEvent): void {
    if (typeof event.data === 'string' && /[eE]/.test(event.data)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  protected onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';

    if (/[eE]/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
