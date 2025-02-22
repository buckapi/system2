import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import PocketBase from 'pocketbase';

@Injectable({
  providedIn: 'root'
})
export class RealtimeProductsService {
  private pb: PocketBase;
  private productsSubject = new BehaviorSubject<any[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8095');
    
    // Autenticación
    this.pb.collection('users')
      .authWithPassword('admin@email.com', 'admin1234')
      .then(() => {
        console.log('Autenticado');
        this.subscribeToRealtimeChanges();
      })
      .catch(err => {
        console.error('Error al autenticar:', err);
      });
  }

  private subscribeToRealtimeChanges(): void {
    // Obtener todos los registros existentes
    this.pb.collection('productsInventory').getList(1, 50).then(records => {
      this.productsSubject.next(records.items);
      
      // Suscribirse a los cambios en tiempo real
      this.pb.collection('productsInventory').subscribe('*', (e) => {
        console.log(e.action, e.record);
        
        const currentProducts = this.productsSubject.value;
        let updatedProducts;

        switch (e.action) {
          case 'create':
            updatedProducts = [...currentProducts, e.record];
            break;
          case 'update':
            updatedProducts = currentProducts.map(req => 
              req.id === e.record.id ? e.record : req
            );
            break;
          case 'delete':
            updatedProducts = currentProducts.filter(req => req.id !== e.record.id);
            break;
          default:
            updatedProducts = currentProducts;
        }

        this.productsSubject.next(updatedProducts);
      }).catch(err => {
        console.error('Error al suscribirse a cambios en tiempo real:', err);
      });
    });
  }

  public unsubscribeFromRealtimeChanges(): void {
    this.pb.collection('productsInventory').unsubscribe('*');
    console.log('Desuscribiéndose de todos los cambios en tiempo real.');
  }
}