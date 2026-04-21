import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPageView } from './landing-page.component';

describe('LandingPageView', () => {
  let fixture: ComponentFixture<LandingPageView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageView],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageView);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the redesigned landing content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Gesundheitsdeklaration');
    expect(compiled.textContent).toContain('Next');
  });
});
