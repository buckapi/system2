import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { RealtimeProductsService } from '../../services/realtime-productos.service';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { RealtimeVentasService } from '../../services/realtime-ventas.service';
import { Modal } from 'bootstrap';
import { UploadService } from '../../services/upload.service';
import { from } from 'rxjs';
import QRCode from 'qrcode';
import PocketBase from 'pocketbase';
export interface PocketBaseError {
  message: string;
  // otras propiedades que puedas necesitar
}
export interface VentaInterface {
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
  productos: {
    idProducto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
}
declare var bootstrap: any;

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cash.component.html',
  styleUrl: './cash.component.css'
})

export class CashComponent {
  terminoBusqueda: string = '';
  productosEncontrados: any[] = [];
  metodoPago: string = 'efectivo';
  fechaActual: string = '';
  horaActual: string = '';
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  productos: any[] = [];
  productosFiltrados: any[] = [];
  pasoActual: number = 1; 
  productosSeleccionados: any[] = [];
  subtotal: number = 0;
  iva: number = 0;
  total: number = 0;
  customer: string = '';
  cantidad: number = 0;
  currentUser: any = null;
  pb: any;
  authStore: any;
  productosVenta: {
    idProducto: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[] = []; 
  totalVentasDelDia: number = 0;
  showForm: boolean = false;
  showCashClose: boolean = false;
  selectedSale: any = null;
  totalStock: number = 0;
  products: any[] = [];
  ventas: any[] = [];
  filteredProducts: any[] = [];

  constructor
  (public global: GlobalService,
    public realtimeProducts: RealtimeProductsService,
    public authPocketbase: AuthPocketbaseService,
    public realtimeVentas: RealtimeVentasService,
    public uploadService: UploadService
    
  ) 
  
  {
    this.fechaActual = new Date().toLocaleDateString();
    this.horaActual = new Date().toLocaleTimeString();
    this.currentUser = this.authPocketbase.getCurrentUser();
    this.pb = this.authPocketbase.getCurrentUser();
    this.authStore = this.pb?.authStore;
    this.totalStock = this.calculateTotalStock();
  
  }
  calculateTotalStock(): number {
    return this.products.reduce((total, product) => total + (product.quantity || 0), 0);
  }
  ngOnInit() {
    this.fechaActual = new Date().toLocaleDateString();
    this.horaActual = new Date().toLocaleTimeString();    
    this.realtimeProducts.products$.subscribe((products: any) => {
      this.productos = products;
      this.productosFiltrados = [...products]; // Inicialmente muestra todos los productos
      console.log('Productos cargados:', this.productos); // Para debugging
    });
   /*  this.realtimeVentas.ventas$.subscribe(ventas => {
      this.ventas = ventas;
      if (ventas) {
        this.totalVentasDelDia = ventas.reduce((total, venta) => total + (venta.total || 0), 0);
      }
    }); */
    this.realtimeVentas.ventas$.subscribe(ventas => {
      this.ventas = ventas;
      console.log('Ventas cargadas:', this.ventas); // Para debugging
      if (ventas) {
          this.totalVentasDelDia = ventas.reduce((total, venta) => total + (venta.total || 0), 0);
      }
    });
  }
  getQrCodeUrl(record: any): string {
    const fileName = record['qrCodeFileName'] || 'default.png'; // Usa un valor por defecto si es necesario
    const fileId = record['qrCodeId'] || 'defaultId'; // Usa un valor por defecto si es necesario
    const token = record['token'] || 'defaultToken'; // Usa un valor por defecto si es necesario
    const url = `https://db.buckapi.com:8095/api/files/42cfd1ktjm69ust/${fileId}/${fileName}?token=${token}`;
    console.log('Generated QR Code URL:', url); // Para debugging
    return url;
  }
  ngAfterViewInit() {
    const inputElement = document.querySelector('input[name="search"]') as HTMLInputElement;
    if (inputElement) {
        inputElement.focus(); // Establecer el enfoque al cargar el componente
    }
}
deleteSale(saleId: string) {
  this.pb.collection('ventas').delete(saleId).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: 'Venta eliminada correctamente'
    });
    // Aquí puedes actualizar tu lista de ventas si es necesario
  }).catch((error: PocketBaseError) => { // Usar un tipo específico
    console.error('Error al eliminar la venta:', error.message);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo eliminar la venta. Por favor, intente nuevamente.'
    });
  });
}
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredProducts = this.products; // O restablecer a la lista original de productos
}
  setFocus(): void {
    const inputElement = document.querySelector('input[name="search"]') as HTMLInputElement;
    if (inputElement) {
        inputElement.focus(); // Establecer el enfoque en el campo de entrada
    }
}
onSearchChange(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  const termino = inputElement.value;
  console.log('Término de búsqueda:', termino); // Para debugging
  this.filtrarProductos(termino);
}
filtrarProductos(termino: string) {
  if (!termino) {
      this.productosFiltrados = [...this.productos];
      return;
  }

  termino = termino.toLowerCase();
  this.productosFiltrados = this.productos.filter(producto => 
      producto.name.toLowerCase().includes(termino) || 
      producto.code.toLowerCase().includes(termino) || 
      producto.codeBarra.toLowerCase().includes(termino) // Filtrar por código de barras
  );
  console.log('Productos filtrados:', this.productosFiltrados); // Para debugging
}


    seleccionarProducto(producto: any) {
      this.productosSeleccionados.push({
        ...producto,
        cantidad: 1
      });
      this.searchTerm = '';
      this.calcularTotal();
      this.pasoActual = 2; // Avanzamos al siguiente paso
    }
  
    eliminarProducto(producto: any) {
      // Primero mostrar confirmación
      Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar ${producto.name} de la lista?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Si el usuario confirma, eliminar el producto
          const index = this.productosSeleccionados.findIndex(p => p.code === producto.code);
          
          if (index !== -1) {
            this.productosSeleccionados.splice(index, 1);
            this.calcularTotal();
  
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El producto ha sido eliminado correctamente',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
  
            // Si no quedan productos, volver al paso 1
            if (this.productosSeleccionados.length === 0) {
              this.irAPaso(1);
            }
          }
        }
      });
    }
  
    calcularTotal() {
      this.total = this.productosSeleccionados.reduce((total, producto) => {
        return total + (producto.price * producto.cantidad);
      }, 0);
    }
  
    agregarProducto(producto: any) {
      // Check if product is already in selected products
      const existingProductIndex = this.productosSeleccionados.findIndex(p => p.id === producto.id);
  
      if (existingProductIndex !== -1) {
        // Product already exists, check stock before incrementing
        const currentStock = producto.stock || 0;
        const currentQuantity = this.productosSeleccionados[existingProductIndex].cantidad;
  
        if (currentQuantity + 1 <= currentStock) {
          this.productosSeleccionados[existingProductIndex].cantidad++;
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Insuficiente',
            text: `Solo quedan ${currentStock} unidades de ${producto.name} en stock.`
          });
        }
      } else {
        // New product, check stock before adding
        if (producto.stock && producto.stock > 0) {
          this.productosSeleccionados.push({
            ...producto,
            cantidad: 1
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Agotado',
            text: `El producto ${producto.name} no tiene stock disponible.`
          });
        }
      }
  
      this.calcularTotal();
    }
    getImageUrl(imageName: string): string {
      const baseUrl = 'https://db.buckapi.com:8095/api/files/';
      return `${baseUrl}${imageName}?token=YOUR_TOKEN_HERE`; // Asegúrate de reemplazar con el token correcto
  }
      procesarPago() {
        if (!this.metodoPago || !this.customer) {
          Swal.fire({
            title: 'Error',
            text: 'Por favor complete todos los campos requeridos',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          return;
        }
      
        Swal.fire({
          title: '¿Está seguro de procesar la venta?',
          text: `Total a pagar: ₡${this.total.toFixed(2)}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, procesar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            const venta = {
              customer: this.customer,
              paymentMethod: this.metodoPago,
              products: this.productosSeleccionados,
              total: this.total,
              idUser: this.currentUser.id,
              unity: this.calculateTotalUnits(),
              subTotal: this.subtotal.toString(),
              iva: this.iva.toString(),
              statusVenta: "completed",
              descuento: "0",
              metodoPago: this.metodoPago,
              date: new Date().toISOString(),
              hora: this.horaActual,
              idProduct: JSON.stringify(this.productosSeleccionados),
              
            };
      
            // Llama a la función para procesar la venta y generar el código QR
            this.processSaleWithQRCode(venta).then(() => {
              // Aquí puedes refrescar la vista o realizar cualquier acción necesaria
              Swal.fire({
                title: '¡Venta exitosa!',
                text: 'La venta ha sido procesada correctamente.',
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.resetearVenta();
              this.irAPaso(1);
            }).catch((error: any) => { // Especifica el tipo de error
              Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al procesar la venta. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonText: 'Ok'
              });
            });
          }
        });
      }
    
 // Función para generar y subir el código QR

processSaleWithQRCode(venta: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const pb = new PocketBase('https://db.buckapi.com:8095');

    QRCode.toDataURL(`venta-${venta.id}`).then((qrCodeUrl) => {
      const byteCharacters = atob(qrCodeUrl.split(',')[1]);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset++) {
        const byte = byteCharacters.charCodeAt(offset);
        byteArrays.push(byte);
      }
      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'image/png' });
      const file = new File([blob], `venta-${venta.id}.png`, { type: 'image/png' });

      const ventaData = {
        customer: venta.customer,
        total: venta.total,
        unity: venta.unity,
        subTotal: venta.subTotal,
        statusVenta: venta.statusVenta,
        descuento: venta.descuento,
        iva: venta.iva,
        metodoPago: venta.metodoPago,
        date: venta.date,
        hora: venta.hora,
        idProduct: venta.idProduct,
        idUser: venta.idUser,
        qrCode: file, // El archivo QR
      };
      pb.collection('ventas').create(ventaData).then((record) => {
        console.log('Venta guardada exitosamente:', record);
        resolve(); // Resuelve la promesa
      }).catch((error) => {
        console.error('Error al guardar la venta:', error);
        reject(error); // Rechaza la promesa en caso de error
      });
    }).catch((error) => {
      console.error('Error generando el código QR:', error);
      reject(error); // Rechaza la promesa en caso de error
    });
  });
}
    
   
  
    // Modify cantidad input to validate stock
    onCantidadChange(producto: any) {
      const currentStock = producto.stock || 0;
      
      if (producto.cantidad > currentStock) {
        producto.cantidad = currentStock;
        Swal.fire({
          icon: 'warning',
          title: 'Stock Insuficiente',
          text: `Solo quedan ${currentStock} unidades de ${producto.name} en stock.`
        });
      }
  
      this.calcularTotal();
    }
   
    // Funciones para navegar entre pasos
    irAPaso(paso: number) {
      this.pasoActual = paso;
    }
 
  actualizarFechaHora() {
    const ahora = new Date();
    
    // Formato más corto
    this.fechaActual = ahora.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    this.horaActual = ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Para formato 24 horas
    });
  } 
  procesarVenta() {
    console.log('Procesando venta...');
    console.log('Productos seleccionados:', this.productosSeleccionados);
    console.log('Customer:', this.customer);
    console.log('Total:', this.total);

  }

  finalizarVenta() {
    console.log('Finalizando venta...');
    console.log('Productos seleccionados:', this.productosSeleccionados);
    console.log('Customer:', this.customer);
    console.log('Total:', this.total);
  }

  imprimirFactura() {
    console.log('Imprimiendo factura...');
    console.log('Productos seleccionados:', this.productosSeleccionados);
    console.log('Customer:', this.customer);
    console.log('Total:', this.total);
  }

  cancelarVenta() {
    console.log('Cancelando venta...');
    console.log('Productos seleccionados:', this.productosSeleccionados);
    console.log('Customer:', this.customer);
    console.log('Total:', this.total);
  }



private calculateTotalUnits(): number {
  return this.productosSeleccionados.reduce((total, producto) => total + producto.cantidad, 0);
}

  
private resetearVenta() {
  this.productosSeleccionados = [];
  this.customer = '';
  this.metodoPago = '';
  this.total = 0;
  }

  private getCurrentUserInfo() {
    const user = this.authPocketbase.getCurrentUser();
    const userId = this.authPocketbase.getUserId();

    return {
      userId,
      userType: user?.type,
      fullName: user?.full_name,
      isAuthenticated: !!userId
    };
  }

openCashModal() {
  this.showForm = true;
  this.showCashClose = false;
}

openCashCloseModal() {
  this.showForm = false;
  this.showCashClose = true;
  this.calcularTotalVentasDelDia(); // Llama a la función para calcular el total de ventas
}

calcularTotalVentasDelDia() {
  this.totalVentasDelDia = this.productosSeleccionados.reduce((total, producto) => {
    return total + (producto.price * producto.cantidad);
  }, 0);
}
volverAOpciones() {
  this.showForm = false;
  this.showCashClose = false;
}

openSaleDetailsModal(venta: any) {
  this.selectedSale = venta;
  const modalElement = document.getElementById('saleDetailsModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}


}