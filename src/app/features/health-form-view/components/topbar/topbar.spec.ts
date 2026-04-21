import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthDeclarationFormService } from '../../../../core/services/health-declaration-form.service';
import { Topbar } from './topbar.component';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let declaration: HealthDeclarationFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
    }).compileComponents();

    declaration = TestBed.inject(HealthDeclarationFormService);
    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render one tab per person and lock unreached future people', async () => {
    declaration.addPerson();
    declaration.addPerson();

    fixture.detectChanges();
    await fixture.whenStable();

    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[data-person-tab]'),
    ) as HTMLButtonElement[];

    expect(tabs.length).toBe(3);
    expect(tabs[0].disabled).toBe(false);
    expect(tabs[1].disabled).toBe(true);
    expect(tabs[2].disabled).toBe(true);
  });
});
