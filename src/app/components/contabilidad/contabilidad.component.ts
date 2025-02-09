import { Component, inject, OnInit } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeVentasService } from '../../services/realtime-ventas.service';
import { RealtimeProductsService } from '../../services/realtime-productos.service';
import { CommonModule } from '@angular/common';
import { GlobalService } from '../../services/global.service';
import { RealtimeGastosService } from '../../services/realtime-gastos.service';
import { RealtimeCuentasxpagarService } from '../../services/realtime-cuentasxpagar.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DataApiService } from '../../services/data-api.service';
import Swal from 'sweetalert2';
import { RealtimeCuentasxcobrarService } from '../../services/realtime-cuentasxcobrar.service';
interface Operacion {
  fecha: Date;
  tipo: 'pagar' | 'cobrar';
  proveedor?: string;
  cliente?: string;
  monto: number;
  estado: 'pendiente' | 'completado';
  metodoPago: string;
  nota?: string;
}
@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contabilidad.component.html',
  styleUrl: './contabilidad.component.css'
})

export class ContabilidadComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private modalInstance: any;
  nuevaCuenta: any = {};
  cuentasPorPagar: any[] = [];
  cuentasPorCobrar: any[] = [];
  cuentasPorPagarModal: any = {};
  cuentasxpagar: FormGroup;
  cuentasxcobrar: FormGroup;
  totalVentas: number = 0;
  totalGastos: number = 0;
  totalCuentasPorPagar: number = 0;
  totalCuentasPorCobrar: number = 0;
  totalCajaChica: number = 0;
  operaciones: Operacion[] = [];
constructor(
  public realtimeVentas: RealtimeVentasService,
  public realtimeProductos: RealtimeProductsService,
  public global: GlobalService,
  public realtimeGastos: RealtimeGastosService,
  public realtimeCuentasxpagar: RealtimeCuentasxpagarService,
  private fb: FormBuilder,
  private http: HttpClient,
  public dataApiService: DataApiService,
  public realtimeCuentasxcobrar: RealtimeCuentasxcobrarService
)
{
  this.realtimeVentas.ventas$.subscribe((ventas) => {
    this.totalVentas = ventas.reduce((total, venta) => total + venta.total, 0);
  });
  this.realtimeGastos.gastos$.subscribe((gastos) => {
    this.totalGastos = gastos.reduce((total, gasto) => total + gasto.cost, 0);
  });
  this.realtimeCuentasxpagar.cuentasxpagar$.subscribe((cuentasxpagar) => {
    this.totalCuentasPorPagar = cuentasxpagar.reduce((monto, cuentasxpagar) => monto + cuentasxpagar.monto, 0);
  });
  this.realtimeCuentasxcobrar.cuentasxcobrar$.subscribe((cuentasxcobrar) => {
    this.totalCuentasPorCobrar = cuentasxcobrar.reduce((monto, cuentasxcobrar) => monto + cuentasxcobrar.monto, 0);
  });
  this.cuentasxpagar = this.fb.group({
    proveedor: ['', Validators.required],
    monto: ['', [Validators.required, Validators.min(0)]],
    fechaVencimiento: ['', Validators.required],
    nota: [''],
    metodoPago: ['', Validators.required]
  });
  this.cuentasxcobrar = this.fb.group({
    cliente: ['', Validators.required],
    monto: ['', [Validators.required, Validators.min(0)]],
    fechaVencimiento: ['', Validators.required],
    nota: [''],
    metodoPago: ['', Validators.required]
  });
}

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    import('bootstrap').then((bootstrap) => {
      const modalElement = document.querySelector('.modal');
      if (modalElement) {
        this.modalInstance = new bootstrap.Modal(modalElement);
      }
    });
  }
}

async guardarCuentaPorPagar() {
  try {
    // Validación inicial del formulario
    console.log('Form validity:', this.cuentasxpagar.valid);
    console.log('Form values:', this.cuentasxpagar.value);

    if (!this.cuentasxpagar.valid) {
      console.log('Formulario inválido. Errores:', this.cuentasxpagar.errors);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos',
      });
      return;
    }

    // Mostrar un mensaje de carga mientras se procesa la solicitud
    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Preparar los datos para enviar al backend
    const nuevaCuentaPorPagar = {
      ...this.cuentasxpagar.value,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
      tipo: 'cuenta_por_pagar',
    };
    console.log('Datos a guardar:', nuevaCuentaPorPagar);

    // Llamada al servicio para guardar los datos
    try {
      const respuesta = await this.dataApiService.addCuentaPorPagar(nuevaCuentaPorPagar).toPromise();
      console.log('Guardado exitoso:', respuesta);

      // Restablecer el formulario y mostrar un mensaje de éxito
      this.cuentasxpagar.reset();
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Cuenta por pagar guardada exitosamente',
        timer: 1500,
      });

      // Cerrar el modal si está disponible
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    } catch (saveError) {
      // Manejo de errores específicos durante la llamada al servicio
      console.error('Error específico al guardar:', saveError);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la cuenta por pagar. Intente nuevamente.',
      });
    }
  } catch (error) {
    // Manejo de errores generales
    console.error('Error general al guardar la cuenta por pagar:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado al guardar la cuenta por pagar.',
    });
  }
}

async guardarCuentaPorCobrar() {
  try {
    // Validación inicial del formulario
    console.log('Form validity:', this.cuentasxcobrar.valid);
    console.log('Form values:', this.cuentasxcobrar.value);

    if (!this.cuentasxcobrar.valid) {
      console.log('Formulario inválido. Errores:', this.cuentasxcobrar.errors);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos',
      });
      return;
    }

    // Mostrar un mensaje de carga mientras se procesa la solicitud
    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Preparar los datos para enviar al backend
    const nuevaCuentaPorCobrar = {
      ...this.cuentasxcobrar.value,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
      tipo: 'cuenta_por_cobrar',
    };
    console.log('Datos a guardar:', nuevaCuentaPorCobrar);

    // Llamada al servicio para guardar los datos
    try {
      const respuesta = await this.dataApiService.addCuentaPorCobrar(nuevaCuentaPorCobrar).toPromise();
      console.log('Guardado exitoso:', respuesta);

      // Restablecer el formulario y mostrar un mensaje de éxito
      this.cuentasxcobrar.reset();
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Cuenta por cobrar guardada exitosamente',
        timer: 1500,
      });

      // Cerrar el modal si está disponible
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    } catch (saveError) {
      // Manejo de errores específicos durante la llamada al servicio
      console.error('Error específico al guardar:', saveError);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la cuenta por cobrar. Intente nuevamente.',
      });
    }
  } catch (error) {
    // Manejo de errores generales
    console.error('Error general al guardar la cuenta por cobrar:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado al guardar la cuenta por cobrar.',
    });
  }
}
agregarOperacion(operacion: Operacion) {
  this.operaciones.unshift(operacion); // Añade al inicio del array
  this.operaciones.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()); // Ordena por fecha descendente
}

verDetalles(operacion: Operacion) {
  // Implementa la lógica para mostrar los detalles
}
}
