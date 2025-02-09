import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { Observable, from, tap, map, BehaviorSubject } from 'rxjs';
import { GlobalService } from './global.service';
import { UserInterface } from '../interface/user-interface'; 

@Injectable({
  providedIn: 'root'
})
export class AuthPocketbaseService {
  private pb: PocketBase;
  complete: boolean = false;
  private userTypeSubject = new BehaviorSubject<string | null>(this.getUserTypeFromStorage());
  userType$ = this.userTypeSubject.asObservable();
  
  constructor( 
    public global: GlobalService
   ) 
  { 
    this.pb = new PocketBase('https://db.buckapi.com:8095');
  }
    generateRandomPassword(length: number = 8): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }

    addEmployee(email: string, name: string,  phone: string): Observable<any> {
      const password = this.generateRandomPassword();
      
      const userData = {
        email: email,
        password: password,
        passwordConfirm: password,
        type: 'empleado',
        username: name,
        name: name
      };
  
      return from(
        this.pb.collection('users').create(userData).then((user) => {
          const employeeData = {
            name: name,
            phone: phone,
            email: email,
            userId: user.id, // Asigna el userId devuelto por PocketBase
            // status: 'active', // Estado del supervisor, puedes cambiarlo según tus necesidades
            // otros campos que quieras agregar
          };
          return this.pb.collection('employees').create(employeeData);
        })
      ).pipe(
        map((response) => ({
          employeeData: response,
          password: password // Devuelve la contraseña generada si necesitas mostrarla o guardarla
        }))
      );
    }

    addTechnical(email: string, name: string, address: string, phone: string): Observable<any> {
      const password = this.generateRandomPassword();
      
      const userData = {
        email: email,
        password: password,
        passwordConfirm: password,
        type: 'tecnico',
        username: name,
        name: name
      };
  
      return from(
        this.pb.collection('users').create(userData).then((user) => {
          const technicalData = {
            name: name,
            // address: address,
            phone: phone,
            email: email,
            userId: user.id, // Asigna el userId devuelto por PocketBase
            // status: 'active', // Estado del supervisor, puedes cambiarlo según tus necesidades
            // otros campos que quieras agregar
          };
          return this.pb.collection('technicals').create(technicalData);
        })
      ).pipe(
        map((response) => ({
          technicalData: response,
          password: password // Devuelve la contraseña generada si necesitas mostrarla o guardarla
        }))
      );
    }


    private isLocalStorageAvailable(): boolean {
      return typeof localStorage !== 'undefined';
    }
  
    // Obtener el tipo de usuario desde el almacenamiento local
    private getUserTypeFromStorage(): string | null {
      if (this.isLocalStorageAvailable()) {
        return localStorage.getItem('type');
      }
      return null;
    }
    setUserType(type: string): void {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem('type', type);
      }
      this.userTypeSubject.next(type);
    }
  
    clearUserType(): void {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem('type');
      }
      this.userTypeSubject.next(null);
    }
  isLogin() {
    return localStorage.getItem('isLoggedin');
  }

  isAdmin() {
    const userType = localStorage.getItem('type');
    return userType === '"admin"';
  }

  isTechnical() {
    const userType = localStorage.getItem('type');
    return userType === '"tecnico"';
  }

  isEmployee() {
    const userType = localStorage.getItem('type');
    return userType === '"empleado"';
  }

  isCustomer() {
    const userType = localStorage.getItem('type');
    return userType === '"cliente"';
  }

  registerUser(email: string, password: string, type: string, name: string, address: string // Añadimos el parámetro address
    ): Observable<any> 
    {
    const userData = {
      email: email,
      password: password,
      passwordConfirm: password,
      type: type,
      username: name,
      name: name,
    };

    // Crear usuario y luego crear el registro en clinics
    return from(
      this.pb
        .collection('users')
        .create(userData)
        .then((user) => {
          const data = {
            full_name: name,
            services: [{ "id": "", "name": "", "price": 0 }],
            address: address, // Usamos el parámetro address aquí
            phone: '', // Agrega los campos correspondientes aquí
            userId: user.id, // Utiliza el ID del usuario recién creado
            status: 'pending', // Opcional, establece el estado del cliente
            images: {}, // Agrega los campos correspondientes aquí
          };
          if (type === 'cliente') {
            return this.pb.collection('customer').create(data);
          } else if (type === 'empleado') {
            return this.pb.collection('employee').create(data);
          } else if (type === 'tecnico') {
            return this.pb.collection('technical').create(data);
          } else {
            throw new Error('Tipo de usuario no válido');
          }
        })
    );
    }
  loginUser(email: string, password: string): Observable<any> {
    return from(this.pb.collection('users').authWithPassword(email, password))
      .pipe(
        map((authData) => {
          const pbUser = authData.record;
          const user: UserInterface = {
            id: pbUser.id,
            email: pbUser['email'],
            password: '', // No almacenamos la contraseña por seguridad
            full_name: pbUser['name'],
            days: pbUser['days'] || {},
            images: pbUser['images'] || {},
            type: pbUser['type'],
            username: pbUser['username'],
            address: pbUser['address'],
            created: pbUser['created'],
            updated: pbUser['updated'],
            avatar: pbUser['avatar'] || '',
            status: pbUser['status'] || 'active',
            biography: pbUser['biography'],
            // Añade aquí cualquier otro campo necesario
          };
          return { ...authData, user };
        }),
        tap((authData) => {
          this.setUser(authData.user);
          this.setToken(authData.token);
          localStorage.setItem('isLoggedin', 'true');
          localStorage.setItem('userId', authData.user.id);
        })
      );
  }

  logoutUser(): Observable<any> {
    // Limpiar la autenticación almacenada
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('dist');
    localStorage.removeItem('userId');
    localStorage.removeItem('type');
    localStorage.removeItem('clientCard');
    localStorage.removeItem('clientFicha');
    localStorage.removeItem('memberId');
    localStorage.removeItem('status');

    this.pb.authStore.clear();
    this.global.setRoute('login');
    // this.virtualRouter.routerActive = "home";
    return new Observable<any>((observer) => {
      observer.next(); // Indicar que la operación de cierre de sesión ha completado
      observer.complete();
    });
  }

  setUser(user: UserInterface): void {
    let user_string = JSON.stringify(user);
    let type = JSON.stringify(user.type);
    localStorage.setItem('currentUser', user_string);
    localStorage.setItem('type', type);
  }
  setToken(token: any): void {
    localStorage.setItem('accessToken', token);
  }
  getCurrentUser(): UserInterface | null {
    if (this.isLocalStorageAvailable()) {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null; // Devuelve el usuario actual o null si no existe
    }
    return null; // Retorna null si no está en un entorno cliente
  }
  
  getUserId(): string {
    if (this.isLocalStorageAvailable()) {
      const userId = localStorage.getItem('userId');
      return userId ? userId : ''; // Devuelve el usuario actual o null si no existe
    }
    return ''; // Retorna vacío si no está en un entorno cliente
  }
  
  getFullName(): string {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);
      return user.full_name || 'Usuario';
    }
    return 'Usuario';
  }
  profileStatus() {
    return this.complete;
  }
  permision() {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.type) {
      this.global.setRoute('login'); // Redirigir al usuario a la ruta 'home' si no hay tipo definido
      return;
    }
    // Llamar a la API para obtener información actualizada del usuario
    this.pb.collection('users').getOne(currentUser.id).then(updatedUser => {
      switch (updatedUser["type"]) {
        case 'admin':
          this.global.setRoute('home'); // Redirigir al cliente a la página principal
          break;
        case 'cliente':
          this.global.setRoute('home'); // Redirigir al cliente a la página principal
          break;
        case 'tecnico':
          this.global.setRoute('home'); // Redirigir al panel de técnico
          break;
        case 'empleado':
          this.global.setRoute('home'); // Redirigir al panel de supervisor
          break;
        default:
          console.warn('Tipo de usuario no reconocido');
          this.global.setRoute('error');
      }
    }).catch(error => {
      console.error('Error al obtener la información del usuario:', error);
      this.global.setRoute('home'); // Redirigir a 'home' en caso de error
    });
  }

  getCollection(collection: string) {
    return this.pb.collection(collection);
  }
  
  
}
