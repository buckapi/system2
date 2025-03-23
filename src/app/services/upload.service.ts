import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import PocketBase from 'pocketbase';
import { GlobalService } from './global.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  public pb: PocketBase;

  constructor(public global: GlobalService) {
    this.pb = new PocketBase('https://db.buckapi.lat:8088');
  }

  /**
   * Carga una imagen y crea un registro de producto.
   * @param file Archivo de imagen a cargar.
   * @param productData Datos del producto.
   * @returns Observable con la respuesta de la creación del producto.
   */
  public uploadAndCreateProduct(file: File, productData: any): Observable<any> {
    return from(this.createProductRecord(file, productData));
  }

  private async createProductRecord(file: File, productData: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', productData.name || '');
      formData.append('description', productData.description || '');
      formData.append('price', productData.price || '');
      formData.append('idCategoria', productData.idCategoria || '');
      formData.append('codeBarra', productData.codeBarra || ''); 
      formData.append('unity', productData.unity || '');
      formData.append('stock', productData.stock || '');
      formData.append('color', productData.color || '');

      // Crear el registro
      const record = await this.pb.collection('productsInventory').create(formData);

      return {
        url: this.pb.files.getUrl(record, record['file']),
        id: record.id,
        filename: record['file'],
        success: true,
        record: record
      };
    } catch (error) {
      console.error('Error creating product record:', error);
      throw new Error('Error al crear el registro del producto.'); // Mensaje de error más específico
    }
  }

  public getFileUrl(record: any): string {
    return this.pb.files.getUrl(record, record['file']);
  }
}