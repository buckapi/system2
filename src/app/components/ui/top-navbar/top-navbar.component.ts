import { Component } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { AuthPocketbaseService } from '../../../services/auth-pocketbase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css'
})
export class TopNavbarComponent {
  isMenuOpen: boolean = false;

  constructor (
    public auth:AuthPocketbaseService,
    public global: GlobalService
  ){
    this.auth.permision();

  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
}
}
