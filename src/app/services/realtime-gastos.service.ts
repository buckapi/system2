import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeGastosService implements OnDestroy {
  private pb: PocketBase;
  private gastosSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public gastos$: Observable<any[]> =
    this.gastosSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8088');
    this.subscribeToGastos();
  }

  private async subscribeToGastos() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    this.pb.collection('gastos').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    this.updateGastosList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    this.updateGastosList();
  }

  private async updateGastosList() {
    const records = await this.pb
      .collection('gastos')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.gastosSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('gastos').unsubscribe('*');
  }
}
