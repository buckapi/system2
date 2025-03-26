import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { TopNavbarComponent } from '../ui/top-navbar/top-navbar.component';
import { DataApiService } from '../../services/data-api.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { FormGroup, FormControl } from '@angular/forms';
import { RealtimeProductsService } from '../../services/realtime-productos.service';
import { HttpClient } from '@angular/common/http';
import { RealtimeEmployeesService } from '../../services/realtime-employees.service';
import { RealtimeVentasService } from '../../services/realtime-ventas.service';
import { Modal } from 'bootstrap';
import { RealtimeCuentasxpagarService } from '../../services/realtime-cuentasxpagar.service';
import { RealtimeCuentasxcobrarService } from '../../services/realtime-cuentasxcobrar.service';

interface WorkInstruction {
    id: string | number; 
    companyName: string;
    contactName: string;
    mobile: string;
    progress: number;
    status: string; 
    created: string;
    updated: string;
    collectionId: string;
    expand: any;
}

interface User {
    name: string;
    role: string;
    lastLogin: string;
}

declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TopNavbarComponent,
    CommonModule    
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent   {
  workInstructions: WorkInstruction[] = [];
  products: any[] = [];
  employees: any[] = [];
  form = new FormGroup({
    code: new FormControl('')
    });
ventas: any[] = [];
  selectedSale: any = null;
  private modal: any;
  loading: boolean = true;
  totalIngresos: number = 0;
  totalStock: number = 0;
  ventasDelDia: any[] = [];
  totalCuentasPorPagar: number = 0;
  totalCuentasPorCobrar: number = 0;
  totalProducts: number = 0;
  constructor(
    public global: GlobalService,
    public auth: AuthPocketbaseService,
    public dataApiService: DataApiService,
    public realtimeProducts: RealtimeProductsService,
    private http: HttpClient,
    public realtimeEmployees: RealtimeEmployeesService,
    public realtimeVentas: RealtimeVentasService,
    public realtimeCuentasxpagar: RealtimeCuentasxpagarService,
    public realtimeCuentasxcobrar: RealtimeCuentasxcobrarService
  ){    
       this.dataApiService.getAllProducts();  
  }

  
  ngOnInit() {
    // Para el conteo total
  this.realtimeProducts.getTotalProductsCount().subscribe(total => {
    this.totalProducts = total;
  });
  
  // Para la lista de productos (paginada)
  this.realtimeProducts.products$.subscribe(products => {
    this.products = products;
  });
    this.realtimeEmployees.employees$.subscribe(employees => {
      this.employees = employees;
    });

    this.realtimeVentas.ventas$.subscribe(ventas => {
      this.ventas = ventas;
      // Ordenar las ventas de forma decreciente
      this.ventas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (ventas) {
        this.totalIngresos = ventas.reduce((total, venta) => total + (venta.total || 0), 0);
      }
    });   

    this.realtimeCuentasxpagar.cuentasxpagar$.subscribe((cuentasxpagar) => {
      this.totalCuentasPorPagar = cuentasxpagar.reduce((monto, cuentasxpagar) => monto + cuentasxpagar.monto, 0);
    });
    this.realtimeCuentasxcobrar.cuentasxcobrar$.subscribe((cuentasxcobrar) => {
      this.totalCuentasPorCobrar = cuentasxcobrar.reduce((monto, cuentasxcobrar) => monto + cuentasxcobrar.monto, 0);
    });
  }

  openSaleDetailsModal(venta: any) {
    this.selectedSale = venta;
    const modalElement = document.getElementById('saleDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  calculateTotalStock(): number {
    return this.products.reduce((total, product) => total + (product.quantity || 0), 0);
}
filtrarVentasDelDia(ventas: any[]): any[] {
  const hoy = new Date().toLocaleDateString(); // Obtiene la fecha actual en formato local
  return ventas.filter(venta => {
    const fechaVenta = new Date(venta.date).toLocaleDateString(); // Convierte la fecha de la venta a formato local
    return fechaVenta === hoy; // Filtra las ventas del día
  });
}
}
