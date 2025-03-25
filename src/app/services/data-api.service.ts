import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GlobalService } from './global.service';
import { map} from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProductService } from './product.service';
export interface productInterface{
  id: string; // Ensure id is included
  name: string;
  price: number;
  stock: number;
  idCategoria: string;
  description: string;
  files: string[];
  color: string;
  codeBarra: string;
  barcode: string;
}
export interface ventaInterface{
  id: string;
  customer: string;
  date: string;
  hora: string;
  metodoPago: string;
  subtotal: number;
  iva: number;
  total: number;
  idEmpleado: string;
  qrCodeUrl: string;
  qrCode: string;
  unity: number;
  subTotal: string;
  statusVenta: string;
  productos: {
    idProducto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
}
export interface employeeInterface{
}
export interface cobranzaInterface{
}
@Injectable({
  providedIn: 'root'
})
export class DataApiService {
  private baseUrl = 'https://db.buckapi.lat:8095/api';

  constructor(
    private http: HttpClient,           
    public global: GlobalService,
    private fb: FormBuilder
  ) { }
  headers : HttpHeaders = new HttpHeaders({  		
    "Content-Type":"application/json"	
});

  
  
  addProduct(request: productInterface) {
    const url_api = this.baseUrl + '/collections/productsInventory/records';
		return this.http.post<productInterface>(url_api, request).pipe(
		  map(data => data)
		);
	  }
  saveVenta(request: ventaInterface) {
    const url_api = this.baseUrl + '/collections/ventas/records';
		return this.http.post<ventaInterface>(url_api, request).pipe(
		  map(data => data)
		);
	  }
   
  getAllProducts(): Observable<ProductService []> {
    return this.http.get<ProductService[]>(`${this.baseUrl}/collections/productsInventory/records`);
  }
/*   updateProduct(id: string, request: productInterface) {
    const url_api = this.baseUrl + `/collections/productsInventory/records/${id}`;
		return this.http.put<productInterface>(url_api, request).pipe(
		  map(data => data)
		);
	  } */
   /*  updateProduct(productId: string, product: productInterface): Observable<productInterface> {
      return this.http.put<productInterface>(`https://db.buckapi.lat:8095/productsInventory/${productId}`, product);
  } */
  /* updateProduct(productId: string, product: productInterface): Observable<productInterface> {
    const url = `https://db.buckapi.lat:8095/productsInventory/${productId}`;
    return this.http.put<productInterface>(url, product);
} */
updateProduct(productId: string, product: productInterface): Observable<any> {
  const url = `https://db.buckapi.lat:8095/api/collections/productsInventory/records/${productId}`;     

    return this.http.patch(url, product).pipe(
    map(response => response)
  );
  }
  
  
  updateProductStock(productId: string, newStock: number) {
      const url_api = `${this.baseUrl}/collections/productsInventory/records/${productId}`;
      const request = { stock: newStock };
      
      return this.http.patch<any>(url_api, request).pipe(
        map(data => data)
      );
    }
  deleteSale(saleId: string) {
    const url_api = this.baseUrl + `/collections/ventas/records/${saleId}`;
    return this.http.delete<ventaInterface>(url_api).pipe(
      map(data => data)
    );
  }
  deleteProduct(productId: string) {
    const url_api = this.baseUrl + `/collections/productsInventory/records/${productId}`;
    return this.http.delete<productInterface>(url_api).pipe(
      map(data => data)
    );
  }

  deleteEmployee(employeeId: string) {
    const url_api = this.baseUrl + `/collections/employees/records/${employeeId}`;
    return this.http.delete<employeeInterface>(url_api).pipe(
      map(data => data)
    );
  }

  uploadImage(file: File) {
    const url_api = this.baseUrl + '/collections/files/records';
    return this.http.post<productInterface>(url_api, file).pipe(
      map(data => data)
    );
  }
  addCuentaPorPagar(request: cobranzaInterface) {
    const url_api = this.baseUrl + '/collections/cuentasxpagar/records';
		return this.http.post<cobranzaInterface>(url_api, request).pipe(
		  map(data => data)
		);
	  }
  addCuentaPorCobrar(request: cobranzaInterface) {
    const url_api = this.baseUrl + '/collections/cuentasxcobrar/records';
		return this.http.post<cobranzaInterface>(url_api, request).pipe(
		  map(data => data)
		);
	  }
    
}
