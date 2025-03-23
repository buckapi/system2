import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeCuentasxpagarService implements OnDestroy {
  private pb: PocketBase;
  private cuentasxpagarSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public cuentasxpagar$: Observable<any[]> =
    this.cuentasxpagarSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8088');
    this.subscribeToCuentasxpagar();
  }

  private async subscribeToCuentasxpagar() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    this.pb.collection('cuentasxpagar').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    this.updateCuentasxpagarList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    this.updateCuentasxpagarList();
  }

  private async updateCuentasxpagarList() {
    const records = await this.pb
      .collection('cuentasxpagar')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.cuentasxpagarSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('cuentasxpagar').unsubscribe('*');
  }
}
