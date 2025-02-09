import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajachicaComponent } from './cajachica.component';

describe('CajachicaComponent', () => {
  let component: CajachicaComponent;
  let fixture: ComponentFixture<CajachicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CajachicaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajachicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
