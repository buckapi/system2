import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeCuentasxcobrarService implements OnDestroy {
  private pb: PocketBase;
  private cuentasxcobrarSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public cuentasxcobrar$: Observable<any[]> =
    this.cuentasxcobrarSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8095');
    this.subscribeToCuentasxcobrar();
  }

  private async subscribeToCuentasxcobrar() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    this.pb.collection('cuentasxcobrar').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    this.updateCuentasxcobrarList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    this.updateCuentasxcobrarList();
  }

    private async updateCuentasxcobrarList() {
    const records = await this.pb
      .collection('cuentasxcobrar')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.cuentasxcobrarSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('cuentasxcobrar').unsubscribe('*');
  }
}
