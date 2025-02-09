import { Component } from '@angular/core';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GlobalService } from '../../services/global.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  passwordVisible: boolean = false; // Variable para mostrar/ocultar la contraseña
  errorMessage: string | null = null;

  constructor(
    public global:GlobalService,
    private authService: AuthPocketbaseService,
    private fb: FormBuilder
  ) {
    // Inicializa el formulario de inicio de sesión con validación básica
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  // Método para manejar el envío del formulario de inicio de sesión
  onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.loginUser(email, password).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso', response);
  
          // Guardar el estado de login y el usuario actual en localStorage
          localStorage.setItem('isLoggedin', 'true');
          this.authService.setUser(response.user); // Suponiendo que `response.user` es el usuario
  
          // Redirigir según el tipo de usuario con `permision()`
          this.authService.permision();
        },
        error: (error) => {
          console.error('Error en el inicio de sesión:', error);
          this.errorMessage = 'Credenciales incorrectas, intenta de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Por favor, completa los campos correctamente.';
    }
  }
  
  /* onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.loginUser(email, password).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso', response);
          localStorage.setItem('isLoggedin', 'true'); // Guardar el estado de login
          const currentUser = this.authService.getCurrentUser();
          this.authService.permision();
        },
        error: (error) => {
          console.error('Error en el inicio de sesión:', error);
          this.errorMessage = 'Credenciales incorrectas, intenta de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Por favor, completa los campos correctamente.';
    }
  } */
}
