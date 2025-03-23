import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import PocketBase from 'pocketbase';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RealtimeProductsService {
  private pb: PocketBase;
  private productsSubject = new BehaviorSubject<any[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8088');
    
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
    this.pb.collection('productsInventory').getList(1, 900).then(records => {
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
// Método para actualizar el stock de un producto
public actualizarStockProducto(productId: string, nuevoStock: number): Observable<any> {
  const body = { stock: nuevoStock };

  // Convierte la promesa en un Observable usando 'from'
  return from(this.pb.collection('productsInventory').update(productId, body));
}

 // Método para obtener el stock de un producto
 // Método para obtener el stock de un producto
async obtenerStockProducto(productId: string): Promise<number> {
  try {
    const producto = await this.pb.collection('productsInventory').getOne(productId);
    return producto['unity']; // Cambiado a notación de corchetes
  } catch (error) {
    console.error('Error al obtener el stock del producto:', error);
    return 0; // Retorna 0 o maneja el error según sea necesario
  }
}
}