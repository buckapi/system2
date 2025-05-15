
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Asegúrate de importar map
import { GlobalService } from './global.service';
import PocketBase from 'pocketbase'; // Import PocketBase

interface Product {
  name: string;
  price: number;
  idCategoria: string;
  description: string;
 /*  unity: number; */ // Change from string to number
  stock: number; // Change from string to number
  color: string;
  files: string[];
  codeBarra: string;
}
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseUrl: string;
  private pb: PocketBase; // Add PocketBase instance

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public global: GlobalService,
  ) {
    this.pb = new PocketBase('https://db.buckapi.lat:8095'); // Initialize PocketBase

    this.baseUrl = 'https://db.buckapi.lat:8095';
  }

  /* createProduct(data: Product): Promise<Product> {
    return this.pb.collection('productsInventoryDemo').create(data);
  } */
  async createProduct(data: Product): Promise<Product> {
    return this.pb.collection('productsInventoryDemo').create(data);
}

 /*  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.pb.baseUrl}/productsInventoryDemo`);
  } */
   // Método para obtener productos con paginación
   getProducts(page: number = 1, perPage: number = 1000): Observable<any[]> {
    let allProducts: any[] = [];
    let currentPage = page;
    let totalProducts = 0;

    return new Observable(observer => {
      // Realizamos la primera solicitud para obtener el total de productos
      this.pb.collection('productsInventoryDemo').getList(currentPage, perPage).then((firstPage: any) => {
        totalProducts = firstPage.totalItems; // Guardamos el total de productos
        allProducts.push(...firstPage.items); // Almacenamos los productos obtenidos en la primera página

        // Iteramos sobre las páginas restantes
        while (allProducts.length < totalProducts) {
          currentPage++; // Avanzamos a la siguiente página
          this.pb.collection('productsInventoryDemo').getList(currentPage, perPage).then((pageData: any) => {
            allProducts.push(...pageData.items); // Agregamos los productos de la página actual
            if (allProducts.length >= totalProducts) {
              observer.next(allProducts); // Cuando hemos obtenido todos los productos, emitimos la respuesta
              observer.complete();
            }
          }).catch(err => {
            observer.error(err); // Manejo de errores
          });
        }
      }).catch(err => {
        observer.error(err); // Manejo de errores en la primera solicitud
      });
    });
  }
  getProductById(productId: string): Promise<Product> {
    return this.pb.collection('productsInventoryDemo').getOne(productId);
  }
  
  updateProduct(productId: string, data: Product): Promise<Product> {
    return this.pb.collection('productsInventoryDemo').update(productId, data);
  }
   

 




}



 
