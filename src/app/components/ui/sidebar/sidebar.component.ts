import { Component } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthPocketbaseService } from '../../../services/auth-pocketbase.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  userType: string | null = null; // Declarar la propiedad userType

  constructor (
    public global: GlobalService,
    public auth: AuthPocketbaseService
  ){
    this.auth.permision();
  }

  ngOnInit(): void {
    // Suscribirse al observable userType$ del servicio de autenticación
    this.auth.userType$.subscribe((type) => {
      this.userType = type; // Asignar el tipo de usuario a la propiedad userType
    });
  }
  
}
