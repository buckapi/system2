import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  option: string = '';
  name: string = '';
  email: string = '';
  password: string = '';
  address: string = '';
constructor(
  public global: GlobalService,
  public auth: AuthPocketbaseService
){}
registerUser() {
  this.auth.registerUser(this.email, this.password, 'tutor', this.name, this.address).subscribe(
    (response) => {
      console.log('Usuario registrado exitosamente', response);
      this.loginAfterRegistration(this.email, this.password);
    },
    (error) => {
      console.error('Error al registrar usuario', error);
    }
  );
}
registerCustomer() {
  if (this.name && this.email && this.password) {
    this.auth.registerUser(this.email, this.password, 'cliente', this.name,'').subscribe(
      (response) => {
        console.log('Customer successfully registered ', response);
        this.loginAfterRegistration(this.email, this.password);
      },
      (error) => {
        console.error('Error al registrar cliente', error);
      }
    );
  } else {
    console.error('Please complete all required fields');
  }
}
 // Método para iniciar sesión después del registro
 loginAfterRegistration(email: string, password: string) {
  this.auth.loginUser(email, password).subscribe(
    (response) => {
      console.log('Inicio de sesión exitoso', response);
      this.global.setRoute('home'); // O la ruta que desees después del inicio de sesión
    },
    (error) => {
      console.error('Error al iniciar sesión después del registro', error);
      this.global.setRoute('login'); // Redirigir al login en caso de error
    }
  );
}
}
