/* import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private pb = new PocketBase('https://db.buckapi.lat:8095');

  constructor(
    private http: HttpClient
  ) {}

  async createProduct(data: any): Promise<any> {
    try {
      const record = await this.pb.collection('productsInventory').create(data);
      return record;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.pb.baseUrl}/productsInventory`);
  }
} */
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
  unity: number; // Change from string to number
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
    return this.pb.collection('productsInventory').create(data);
  } */
  async createProduct(data: Product): Promise<Product> {
    return this.pb.collection('productsInventory').create(data);
}

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.pb.baseUrl}/productsInventory`);
  }
}