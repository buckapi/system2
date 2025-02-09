import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';

@Component({
  selector: 'app-form-request',
  standalone: true,
  imports: [],
  templateUrl: './form-request.component.html',
  styleUrl: './form-request.component.css'
})
export class FormRequestComponent {
  constructor(
    public global: GlobalService
  ){}

}
