import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeEmployeesService implements OnDestroy {
  private pb: PocketBase;
  private employeesSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public employees$: Observable<any[]> =
    this.employeesSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8095');
    this.subscribeToEmployees();
  }

  private async subscribeToEmployees() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    this.pb.collection('employees').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    this.updateEmployeesList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    // Actualizar la lista de esemployeeas
    this.updateEmployeesList();
  }

  private async updateEmployeesList() {
    // Obtener la lista actualizada de esemployeeas
    const records = await this.pb
      .collection('employees')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.employeesSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('employees').unsubscribe('*');
  }
}
