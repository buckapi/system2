import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RealtimeVentasService implements OnDestroy {
  private pb: PocketBase;
  private ventasSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public ventas$: Observable<any[]> =
    this.ventasSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8088');
    this.subscribeToVentas();
  }

  private async subscribeToVentas() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    this.pb.collection('ventas').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    // Inicializar la lista de esupervisoras
    this.updateVentasList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    // Actualizar la lista de esupervisoras
    this.updateVentasList();
  }

  private async updateVentasList() {
    // Obtener la lista actualizada de esupervisoras
    const records = await this.pb
      .collection('ventas')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.ventasSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('ventas').unsubscribe('*');
  }
}
