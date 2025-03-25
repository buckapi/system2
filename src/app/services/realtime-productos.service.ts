import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { shareReplay, debounceTime, switchMap, map } from 'rxjs/operators';
import PocketBase from 'pocketbase';

@Injectable({
  providedIn: 'root'
})
export class RealtimeProductsService {
  private pb: PocketBase;
  private productsSubject = new BehaviorSubject<any[]>([]);
  private isInitialized = false;
  private currentPage = 1;
  private perPage = 50;
  private allProductsCache: any[] = [];
  private debounceTimer: any;

  // Observable público con shareReplay
  public products$ = this.productsSubject.asObservable().pipe(
    shareReplay(1)
  );

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.lat:8095');
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
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

  // Método para obtener productos paginados
  public getPaginatedProducts(page: number = 1, perPage: number = 50): Observable<any> {
    this.currentPage = page;
    this.perPage = perPage;
    return from(this.pb.collection('productsInventory').getList(page, perPage));
  }

  // Método para obtener todos los productos (usado en realtime)
  private getAllProducts(): Promise<any> {
    if (this.allProductsCache.length > 0) {
      return Promise.resolve({ items: this.allProductsCache });
    }
    return this.pb.collection('productsInventory').getList(1, 900);
  }
  public getTotalProductsCount(): Observable<number> {
    return from(this.pb.collection('productsInventory').getList(1, 1)).pipe(
      map(response => response.totalItems)
    );
  }

  // Suscripción a cambios en tiempo real con debounce
  private subscribeToRealtimeChanges(): void {
    this.getAllProducts().then(records => {
      this.allProductsCache = records.items;
      this.productsSubject.next(records.items);
      
      this.pb.collection('productsInventory').subscribe('*', (e) => {
        // Implementación del debounce manual
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.handleRealtimeEvent(e);
        }, 300);
      }).catch(err => {
        console.error('Error al suscribirse a cambios en tiempo real:', err);
      });
    });
  }

  // Manejo de eventos en tiempo real
  private handleRealtimeEvent(e: any): void {
    const currentProducts = [...this.allProductsCache];
    let updatedProducts = [...currentProducts];

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
    }

    // Actualizar cache y subject
    this.allProductsCache = updatedProducts;
    this.productsSubject.next(updatedProducts);
  }

  public unsubscribeFromRealtimeChanges(): void {
    this.pb.collection('productsInventory').unsubscribe('*');
    clearTimeout(this.debounceTimer);
    console.log('Desuscribiéndose de todos los cambios en tiempo real.');
  }

  public actualizarStockProducto(productId: string, nuevoStock: number): Observable<any> {
    const body = { stock: nuevoStock };
    return from(this.pb.collection('productsInventory').update(productId, body));
  }

  public async obtenerStockProducto(productId: string): Promise<number> {
    try {
      const producto = await this.pb.collection('productsInventory').getOne(productId);
      return producto['unity'];
    } catch (error) {
      console.error('Error al obtener el stock del producto:', error);
      return 0;
    }
  }
}