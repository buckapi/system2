import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


export interface PocketBaseError {
  message: string;
  // otras propiedades que puedas necesitar
}
export interface VentaInterface {
  ventas: any[];
  id: string;
  customer: string;
  customerEmail: string;
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
  customerEmail: string = '';
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
  ventasDelDia: any[] = [];
  private searchTimeout: any;
  showOptions: boolean = false;
  venta: any = null;

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
  
    // Suscripción a los productos
    this.realtimeProducts.products$.subscribe((products: any) => {
      this.productos = products;
      this.productosFiltrados = [...products];
    });
  
    // Suscripción a las ventas
    this.realtimeVentas.ventas$.subscribe(ventas => {
      this.ventas = ventas;
      this.ventasDelDia = this.filtrarVentasDelDia(ventas); // Filtra las ventas del día
      this.calcularTotalVentasDelDia(); // Calcula el total de ventas del día
    });
    
  }
  toggleOptions() {
    this.showOptions = !this.showOptions; // Alternar la visibilidad de las opciones
}

handleVenta() {
    // Lógica para manejar la venta
    console.log('Venta seleccionada');
    this.showOptions = false; // Ocultar opciones después de seleccionar
}

handleCierreCaja() {
    // Lógica para manejar el cierre de caja
    console.log('Cierre de caja seleccionado');
    this.showOptions = false; // Ocultar opciones después de seleccionar
}
  getQrCodeUrl(record: any): string {
    const fileName = record['qrCodeFileName'] || 'default.png'; // Usa un valor por defecto si es necesario
    const fileId = record['qrCodeId'] || 'defaultId'; // Usa un valor por defecto si es necesario
    const token = record['token'] || 'defaultToken'; // Usa un valor por defecto si es necesario
    const url = `https://db.buckapi.lat:8095/api/files/42cfd1ktjm69ust/${fileId}/${fileName}?token=${token}`;
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

  clearTimeout(this.searchTimeout); // Limpiar el timeout anterior
  this.searchTimeout = setTimeout(() => {
      this.filtrarProductos(termino);
  }, 300); // Ajusta el tiempo según sea necesario
}
filtrarProductos(termino: string) {
  if (!termino) {
      this.productosFiltrados = [...this.productos];
      return;
  }

  termino = termino.toLowerCase();
  this.productosFiltrados = this.productos.filter(producto => 
      producto.name.toLowerCase().includes(termino) || 
      producto.barcode.toLowerCase().includes(termino) // Filtrar por código de barras
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
  this.productosSeleccionados.forEach(producto => {
    if (producto.cantidad > producto.stock) {
      console.error(`La cantidad para ${producto.name} excede el stock disponible.`);
      Swal.fire({
        title: 'Error!',
        text: `No hay suficiente stock para ${producto.name}. Solo quedan ${producto.stock} unidades.`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      // producto.cantidad = producto.stock; 
      this.total = this.productosSeleccionados.reduce((total, producto) => {
        return total + (producto.price * producto.cantidad);
        }, 0);
      // Ajustar la cantidad al stock disponible
    }
    // Aquí puedes agregar el cálculo total si es necesario
  });
}
totalVenta() {
  return this.productosSeleccionados.reduce((total, producto) => {
    return total + (producto.price * producto.cantidad);
  }, 0);
}

getImageUrl(imageName: string): string {
const baseUrl = 'https://db.buckapi.lat:8095/api/files/';
return `${baseUrl}${imageName}?token=YOUR_TOKEN_HERE`; // Asegúrate de reemplazar con el token correcto
}
async procesarPago() {
  // Validar campos requeridos
  if (!this.metodoPago || !this.customer) {
    Swal.fire({
      title: 'Error',
      text: 'Por favor complete todos los campos requeridos',
      icon: 'error',
      confirmButtonText: 'Ok'
    });
    return;
  }

  // Verificar stock disponible para cada producto
  for (const producto of this.productosSeleccionados) {
    const stockDisponible = await this.realtimeProducts.obtenerStockProducto(producto.id);
    if (producto.cantidad > stockDisponible) {
      Swal.fire({
        title: 'Cantidad no disponible',
        text: `No hay suficiente stock para ${producto.name}. Stock disponible: ${stockDisponible}`,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
  }

  // Confirmar la venta con el usuario
  Swal.fire({
    title: '¿Está seguro de procesar la venta?',
    text: `Total a pagar: ₡${this.totalVenta().toFixed(2)}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, procesar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Crear el objeto de venta
        const venta = {
          customer: this.customer,
          paymentMethod: this.metodoPago,
          products: this.productosSeleccionados,
          total: this.totalVenta(),
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

        // Procesar la venta y generar el código QR
        await this.processSaleWithQRCode(venta);

        // Actualizar el stock de los productos vendidos
        await this.actualizarStockProductos();

        // Reiniciar la cantidad de unidades después de la venta
        this.productosSeleccionados.forEach(producto => {
          producto.cantidad = 0; // Reiniciar la cantidad
        });

        // Mostrar mensaje de éxito
        Swal.fire({
          title: '¡Venta exitosa!',
          text: 'La venta ha sido procesada correctamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });

        // Reiniciar la venta y volver al paso 1
        this.resetearVenta();
        this.irAPaso(1);
      } catch (error) {
        // Manejar errores durante el proceso
        console.error('Error al procesar la venta:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al procesar la venta. Por favor, intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    }
  });
}
actualizarStockProductos() {
  this.productosSeleccionados.forEach(producto => {
    const nuevoStock = producto.stock - producto.cantidad; // Restar la cantidad vendida del stock actual

    // Verificar que el nuevo stock no sea negativo
    if (nuevoStock < 0) {
      console.error(`No se puede actualizar el stock de ${producto.name}: stock insuficiente.`);
      Swal.fire({
        title: 'Error!',
        text: `No hay suficiente stock para ${producto.name}.`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return; // Salir de la función si el stock es insuficiente
    }

    // Llamada al servicio para actualizar el stock
    this.realtimeProducts.actualizarStockProducto(producto.id, nuevoStock).subscribe(
      response => {
        console.log(`Stock actualizado para ${producto.name}: ${nuevoStock}`);
        producto.stock = nuevoStock; // Actualiza el stock localmente
      },
      error => {
        console.error(`Error al actualizar el stock de ${producto.name}:`, error);
      }
    );
  });
}

  agregarProducto(producto: any) {
    const existingProductIndex = this.productosSeleccionados.findIndex(p => p.id === producto.id);
  
    if (existingProductIndex !== -1) {
      const currentStock = producto.stock || 0;
      const currentQuantity = this.productosSeleccionados[existingProductIndex].cantidad;
  
      if (currentQuantity + 1 <= currentStock) {
        this.productosSeleccionados[existingProductIndex].cantidad++;
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Cantidad Insuficiente',
          text: `No puedes agregar más de ${currentStock} unidades de ${producto.name}.`
        });
      }
    } else {
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
 // Función para generar y subir el código QR

 processSaleWithQRCode(venta: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const pb = new PocketBase('https://db.buckapi.lat:8095');

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
        total: venta.total, // Asegúrate de incluir el total
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
        qrCodeUrl: qrCodeUrl,
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
      producto.cantidad = currentStock; // Ajustar la cantidad al stock disponible
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
  this.customerEmail = '';
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
  this.showOptions = false; // Ocultar opciones después de seleccionar

}


openCashCloseModal() {
  this.showForm = false;
  this.showCashClose = true;
  this.calcularTotalVentasDelDia(); // Llama a la función para calcular el total de ventas
  this.ventasDelDia = this.filtrarVentasDelDia(this.ventas); // Filtra las ventas del día
  this.showOptions = false; // Ocultar opciones después de seleccionar
  }


calcularTotalVentasDelDia() {
  console.log('Ventas del día:', this.ventasDelDia); // Verificar qué hay en ventasDelDia
  this.totalVentasDelDia = this.ventasDelDia.reduce((total, venta) => total + (venta.total || 0), 0);
  console.log('Total de ventas del día:', this.totalVentasDelDia); // Verificar el total calculado
}


filtrarVentasDelDia(ventas: any[]): any[] {
  const hoy = new Date().toLocaleDateString(); // Obtiene la fecha actual en formato local
  return ventas.filter(venta => {
    const fechaVenta = new Date(venta.date).toLocaleDateString(); // Convierte la fecha de la venta a formato local
    return fechaVenta === hoy; // Filtra las ventas del día
  });
}
reiniciarVentasDelDia() {
  const hoy = new Date().toLocaleDateString();
  this.ventas = this.ventas.filter(venta => new Date(venta.date).toLocaleDateString() !== hoy);
  this.totalVentasDelDia = 0;
}
realizarCierreDeCaja() {
  Swal.fire({
    title: '¿Está seguro de realizar el cierre de caja?',
    text: `Total de ventas del día: ₡${this.totalVentasDelDia.toFixed(2)}`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, realizar cierre',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.reiniciarVentasDelDia();
      Swal.fire({
        title: '¡Cierre de caja realizado!',
        text: 'El cierre de caja ha sido realizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Ok'
      });
      this.volverAOpciones();
    }
  });
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
   /* generatePDF(venta: any) {
        const pdf = new jsPDF({
          unit: 'mm',
          format: [80, 297], // 80mm de ancho
          hotfixes: ['px_scaling']
        });
      
        // Configuración de estilos
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
      
        // Logo (cambia la ruta según tu estructura)
        const imgData = 'assets/images/logo/logo.png';
  const logoWidth = 20;
  const logoHeight = 20;
  const centeredX = (80 - logoWidth) / 2; // Centrado en 80mm
  pdf.addImage(imgData, 'PNG', centeredX, 5, logoWidth, logoHeight);

      
        // Encabezado
        pdf.text('FACTURA', 40, 30, { align: 'center' });
        pdf.setLineWidth(0.2);
        pdf.line(10, 35, 70, 35); // Línea divisoria
      
        // Información de la factura
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Fecha: ${venta.date}`, 5, 40);
        pdf.text(`Hora: ${new Date().toLocaleTimeString()}`, 5, 45);
        
        // Datos del cliente
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cliente:', 5, 50);
        pdf.setFont('helvetica', 'normal');
        pdf.text(venta.customer, 20, 50);
        
        if (venta.customerEmail) {
          pdf.text('Correo:', 5, 55);
          pdf.text(venta.customerEmail, 20, 55);
        }
        
        pdf.text('Método de pago:', 5, 60);
        pdf.text(venta.metodoPago, 30, 60);
      
        // Tabla de productos
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.line(10, 65, 70, 65); // Línea divisoria
        
        // Encabezados de tabla
        pdf.text('Producto', 5, 70);
        pdf.text('Cant.', 40, 70);
        pdf.text('Precio', 55, 70);
        pdf.text('Total', 70, 70, { align: 'right' });
        
        pdf.line(10, 72, 70, 72); // Línea divisoria
        pdf.setFont('helvetica', 'normal');
      
        let yPos = 77;
        // Verificamos y recorremos los productos
        if (venta.productosSeleccionados && venta.productosSeleccionados.length > 0) {
          venta.productosSeleccionados.forEach((producto: any) => {
            // Nombre del producto (con ajuste si es muy largo)
            const nombre = producto.name.length > 20 ? producto.name.substring(0, 17) + '...' : producto.name;
            pdf.text(nombre, 5, yPos);
            
            // Resto de datos
            pdf.text(producto.cantidad.toString(), 40, yPos);
            pdf.text(`₡${producto.price.toFixed(2)}`, 55, yPos);
            pdf.text(`₡${(producto.price * producto.cantidad).toFixed(2)}`, 70, yPos, { align: 'right' });
            
            yPos += 5;
            
            // Salto de página si se llega al final
            if (yPos > 250) {
              pdf.addPage();
              yPos = 20;
            }
          });
        } else {
          pdf.text('No hay productos', 5, yPos);
          yPos += 5;
        }
      
        // Total
        pdf.line(10, yPos, 70, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL:', 50, yPos);
        pdf.text(`₡${venta.total.toFixed(2)}`, 70, yPos, { align: 'right' });
        yPos += 5;
        pdf.line(10, yPos, 70, yPos);
      
        // Pie de página
        yPos += 10;
        pdf.setFontSize(8);
        pdf.text('¡Gracias por su compra!', 40, yPos, { align: 'center' });
      
        // Guardar PDF
        pdf.save(`factura-${venta.id}.pdf`);
      } */
        generatePDF(venta: any) {
          if (!venta) return;
        
          const pdf = new jsPDF({
            unit: 'mm',
            format: [80, 297],
            hotfixes: ['px_scaling']
          });
        
          // Configuración de estilos
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
        
          // Logo (centrado)
          try {
            const imgData = 'assets/images/logo/logo.png';
            const logoWidth = 20;
            const logoHeight = 20;
            const centeredX = (80 - logoWidth) / 2;
            pdf.addImage(imgData, 'PNG', centeredX, 5, logoWidth, logoHeight);
          } catch (e) {
            console.log('Logo no encontrado, continuando sin él');
          }
        
          // Encabezado
          pdf.text('DETALLE DE VENTA', 40, 30, { align: 'center' });
          pdf.setLineWidth(0.2);
          pdf.line(10, 35, 70, 35);
        
          // Información de la factura
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Fecha: ${this.formatDate(venta.date)}`, 5, 40);
          pdf.text(`Hora: ${this.formatTime(venta.date)}`, 5, 45);
          
          // Datos del cliente
          pdf.setFont('helvetica', 'bold');
          pdf.text('Cliente:', 5, 50);
          pdf.setFont('helvetica', 'normal');
          pdf.text(venta.customer || 'No especificado', 20, 50);
          
          if (venta.customerEmail) {
            pdf.text('Correo:', 5, 55);
            pdf.text(venta.customerEmail, 20, 55);
          }
        
          // Tabla de productos
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.line(10, 65, 70, 65);
          
          // Encabezados de tabla
          pdf.text('Producto', 5, 70);
          pdf.text('Cant.', 40, 70);
          pdf.text('P.U.', 55, 70);
          pdf.text('Total', 70, 70, { align: 'right' });
          
          pdf.line(10, 72, 70, 72);
          pdf.setFont('helvetica', 'normal');
        
          let yPos = 77;
          if (venta.idProduct && venta.idProduct.length > 0) {
            venta.idProduct.forEach((producto: any) => {
              const nombre = producto.name.length > 20 ? 
                            producto.name.substring(0, 17) + '...' : 
                            producto.name;
              pdf.text(nombre, 5, yPos);
              
              pdf.text(venta.unity.toString(), 40, yPos);
              
              // VALORES MONETARIOS SIN SÍMBOLO ₡
              const precioUnitario = this.formatNumber(producto.price);
              const totalProducto = this.formatNumber(producto.price * venta.unity);
              
              pdf.text(precioUnitario, 55, yPos);
              pdf.text(totalProducto, 70, yPos, { align: 'right' });
              
              yPos += 5;
              
              if (yPos > 250) {
                pdf.addPage();
                yPos = 20;
              }
            });
          } else {
            pdf.text('No hay productos', 5, yPos);
            yPos += 5;
          }
        
          // Total sin símbolo ₡
          pdf.line(10, yPos, 70, yPos);
          yPos += 5;
          pdf.setFont('helvetica', 'bold');
          pdf.text('TOTAL:', 50, yPos);
          pdf.text(this.formatNumber(venta.total), 70, yPos, { align: 'right' });
          yPos += 5;
          pdf.line(10, yPos, 70, yPos);
        
          // Pie de página
          yPos += 10;
          pdf.setFontSize(8);
          pdf.text('¡Gracias por su compra!', 40, yPos, { align: 'center' });
        
          pdf.save(`venta-${venta.id}.pdf`);
        }
        
        // Método para formato numérico sin símbolo ₡
        formatNumber(value: number): string {
  // Redondea al entero más cercano y formatea con separadores de miles
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
        
        // Métodos auxiliares para formato de fecha y hora (se mantienen igual)
        formatDate(dateString: string): string {
          const date = new Date(dateString);
          return date.toLocaleDateString('es-ES');
        }
        
        formatTime(dateString: string): string {
          const date = new Date(dateString);
          return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
      }
