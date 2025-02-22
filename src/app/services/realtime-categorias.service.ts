import { Injectable, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RealtimeCategoriasService implements OnDestroy {
  private pb: PocketBase;
  private categoriasSubject = new BehaviorSubject<any[]>([]);

  // Esta es la propiedad que expondrá el Observable para que los componentes puedan suscribirse a ella
  public categorias$: Observable<any[]> =
    this.categoriasSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8095');
    this.subscribeToCategorias();
  }

  private async subscribeToCategorias() {
    // (Opcional) Autenticación
    await this.pb
      .collection('users')
      .authWithPassword('admin@email.com', 'admin1234');

    this.pb.collection('categorias').subscribe('*', (e) => {
      this.handleRealtimeEvent(e);
    });

    this.updateCategoriasList();
  }

  private handleRealtimeEvent(event: any) {
    // Aquí puedes manejar las acciones 'create', 'update' y 'delete'
    console.log(event.action);
    console.log(event.record);

    this.updateCategoriasList();
  }

  private async updateCategoriasList() {
    const records = await this.pb
      .collection('categorias')
      .getFullList(200 /* cantidad máxima de registros */, {
        sort: '-created', // Ordenar por fecha de creación
      });
    this.categoriasSubject.next(records);
  }

  ngOnDestroy() {
    // Desuscribirse cuando el servicio se destruye
    this.pb.collection('categorias').unsubscribe('*');
  }
}
