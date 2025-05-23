import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { AuthPocketbaseService } from '../../services/auth-pocketbase.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { RealtimeProductsService } from '../../services/realtime-productos.service';
import { RealtimeCategoriasService } from '../../services/realtime-categorias.service';
import { NewCategoryModalComponent } from '../new-category-modal/new-category-modal.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RealtimeVentasService } from '../../services/realtime-ventas.service';
import { UploadService } from '../../services/upload.service';
import { from, Observable, Subject } from 'rxjs';
import { BarcodeComponent } from '../barcode/barcode.component';
import JsBarcode from 'jsbarcode'; // Use default import
import { ProductService } from '../../services/product.service';
import PocketBase from 'pocketbase';
import Compressor from 'compressorjs';
import { shareReplay, takeUntil } from 'rxjs/operators';
import jsPDF from 'jspdf';



export interface PocketBaseError {
  message: string;
  // otras propiedades que puedas necesitar
}
export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  idCategoria: string;
  description: string;
  unity: number; 
  stock: number;
  color: string;
  files: string[];
  codeBarra: string;
  file?: string; 
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  matchCount: number = 0; // Add this line to declare the matchCount property

  private pb: PocketBase;
  private apiUrl = 'https://db.buckapi.lat:8095';
  showForm = false;
  isEditing = false;
  previewImage: string = 'assets/images/thumbs/setting-profile-img.jpg';
  products: any[] = []; // Changed Product to any[] since Product type is not defined
  products$: any;
  currentProductId: string | null = null;

  showFilter = false;
  ventas: any[] = [];
  imagePreview: string | null = null; // Para mostrar la vista previa de la imagen
  selectedFile: File | null = null;
  selectedCategory: string = ''; // Default category
  searchQuery: string = ''; // Default search query
  productosFiltrados: any[] = [];
  productos$: any;
  product = {
    name: '',
    price: 0, // Change to string
    idCategoria: '', // Include categorias
    description: '', // Include description
    files: [] , // Include files as an array
    stock: 0,
    color: '',
    codeBarra: '',
    barcode: ''
  };
  totalProductos: number = 0;
  productos: any[] = [];
  userName: string = '';
  showCategories: boolean = false;
  showProducts: boolean = false;
  addProductForm: FormGroup;
  selectedImage: File | null = null;
  selectedImagePrev: string = '';
  currentPage: number = 1;
  pageSize: number = 50; // Set your desired page size
/*   totalProducts: number = 0;
 */  perPage = 50;
  totalProducts = 0;
  destroy$ = new Subject<void>();
  paginatedProducts: any[] = [];
  showAllProducts = false;
  searchTerm: string = '';
  filteredProducts: Product[] = [];
  constructor(
    public global: GlobalService,
    private fb: FormBuilder,
    public auth: AuthPocketbaseService,
    public realtimeProducts: RealtimeProductsService,
    public realtimeCategorias: RealtimeCategoriasService,
    private dialog: MatDialog,
    public realtimeVentas: RealtimeVentasService,
    public uploadService: UploadService,
    public productService: ProductService
  ) {
    this.pb = new PocketBase(this.apiUrl); 
    this.addProductForm = this.fb.group({
      name: [''],
      price: [''],
      stock: [0, Validators.required], // Inicializa el stock como número (por defecto 0)
      idCategoria: [''],
      description: [''],
      files: [''],
      unity: [''],
      color: [''],
      codeBarra: ['']
    });
    
    this.showForm = false;
    this.isEditing = false;    
  }
  ngOnInit() {
    this.loadProductsCount();
    this.loadPaginatedProducts();
    this.loadProducts();
    this.global.applyFilters(this.selectedCategory, this.searchQuery); // Initial call to set up default view
}
  
   /*  loadProducts() {
       // Cargar productos inicialmente
      this.productService.getProducts().subscribe(products => {
        this.products = products.map(product => {
          product.file = this.uploadService.getFileUrl(product);
          return product;
        });
      });
    
      // Suscribirse a los cambios en tiempo real
      this.realtimeProducts.products$.subscribe((products: any[]) => {
        this.products = products.map(product => {
          product.file = this.uploadService.getFileUrl(product);
          return product;
        });
      }); 
    }  */
    /*   loadProducts(page: number = 1) {
        this.realtimeProducts.getPaginatedProducts(page, 1000)
          .subscribe(response => {
            this.products = response.items;
            this.totalProducts = response.totalItems;
          });
      } */
      loadProducts() {
        if (this.showAllProducts) {
          // Cargar todos los productos
          this.realtimeProducts.getAllProducts().then(products => {
            this.products = products.items;
            this.filterProducts();
          });
        } else {
          // Cargar productos paginados
          this.realtimeProducts.getPaginatedProducts(this.currentPage, this.perPage)
            .subscribe(response => {
              this.paginatedProducts = response.items;
              this.totalProducts = response.totalItems;
              this.filterProducts();
            });
        }
        // Suscribirse a los cambios en tiempo real
      this.realtimeProducts.products$.subscribe((products: any[]) => {
        this.products = products.map(product => {
          product.file = this.uploadService.getFileUrl(product);
          return product;
        });
      }); 
      }
    /* filterProducts() {
      this.filteredProducts = this.products.filter(product => 
          product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
  } */
      filterProducts() {
        const sourceProducts = this.showAllProducts ? this.products : this.paginatedProducts;
        
        this.filteredProducts = sourceProducts.filter(product => 
          product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        
        this.matchCount = this.filteredProducts.length;
      }
  loadProductsCount() {
    this.realtimeProducts.getTotalProductsCount().pipe(
      takeUntil(this.destroy$)
    ).subscribe(total => {
      this.totalProducts = total;
    });
  }

  loadPaginatedProducts() {
    this.realtimeProducts.getPaginatedProducts(this.currentPage, this.perPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe((response: { items: Product[] }) => { // Tipar la respuesta
      this.paginatedProducts = response.items.map((product: Product) => {
        product.file = this.uploadService.getFileUrl(product);
        return product;
      });
      this.filterProducts();
    });
  }

/*   toggleViewAll() {
    this.showAllProducts = !this.showAllProducts;
    if (this.showAllProducts) {
      // Cargar todos los productos
      this.realtimeProducts.products$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(products => {
        this.paginatedProducts = products.map(product => {
          product.file = this.uploadService.getFileUrl(product);
          return product;
        });
        this.filterProducts();
      });
    } else {
      // Volver a la vista paginada
      this.loadPaginatedProducts();
    }
  } */
  toggleViewAll() {
    this.showAllProducts = !this.showAllProducts;
    this.loadProducts(); // Recargar productos según el nuevo modo
  }
  /* nextPage() {
    if (this.currentPage * this.perPage < this.totalProducts) {
      this.currentPage++;
      this.loadPaginatedProducts();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPaginatedProducts();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadPaginatedProducts();
  }
   */
  nextPage() {
    if (this.currentPage * this.perPage < this.totalProducts) {
      this.currentPage++;
      this.loadProducts();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }
  
  goToPage(page: number) {
    this.currentPage = page;
    this.loadProducts();
  }
  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalProducts / this.perPage);
    const pagesToShow = 5; // Número máximo de páginas a mostrar
    const startPage = Math.max(1, this.currentPage - Math.floor(pagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  searchTimeout: any; // Declare a timeout variable

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const searchTerm = inputElement.value;
    console.log('Término de búsqueda:', searchTerm); // For debugging

    clearTimeout(this.searchTimeout); // Clear the previous timeout
    this.searchTimeout = setTimeout(() => {
        this.searchTerm = searchTerm; // Update the searchTerm
        this.filterProducts(); // Call the filtering method
    }, 300); // Adjust the time as necessary
}
    /* prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadProducts(); // Carga los productos de la página anterior
      }
    } */
    
  onFilterChange() {
    this.global.applyFilters(this.selectedCategory, this.searchQuery);
  }
  
  
  openNewCategoryModal() {
    const dialogRef = this.dialog.open(NewCategoryModalComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar las categorías si se agregó una nueva
        this.realtimeCategorias.categorias$;
      }
    });
  }

  showNewProduct() {
  this.showForm = !this.showForm;
  if (this.showForm) {
    this.isEditing = false;
    this.addProductForm.reset();
    this.previewImage = 'assets/images/thumbs/setting-profile-img.jpg';
    // Set default values if needed
    this.addProductForm.patchValue({
      price: 0,
      stock: 1,
      color: '', 
      file: '',
      name: ''
    });
  }
  }
  generateBarcode(): { barcode: string; canvas: HTMLCanvasElement } {
    const barcode = Math.random().toString(36).substr(2, 9);

    const canvas = document.createElement('canvas');
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      lineColor: "#0aa",
      width: 4,
      height: 250,
      displayValue: true
    });
    return { barcode, canvas };
  }


  onImageChange(event: any): void {
      const file = event.target.files[0];
      if (file) {
          this.selectedImage = file;
  
          // Comprimir la imagen antes de mostrarla o subirla
          new Compressor(file, {
              quality: 0.6, // Ajusta la calidad (de 0 a 1, donde 1 es la mejor calidad)
              maxWidth: 800, // Redimensiona la imagen si su ancho es mayor a este valor
              maxHeight: 800, // Redimensiona la imagen si su altura es mayor a este valor
              success: (compressedFile: Blob) => {
                  // Crear un nuevo objeto File con las propiedades necesarias
                  const fileName = file.name;
                  const fileType = file.type;
                  const fileLastModified = file.lastModified;
  
                  const newFile = new File([compressedFile], fileName, {
                      type: fileType,
                      lastModified: fileLastModified
                  });
  
                  // Después de comprimir la imagen, crea la vista previa
                  const reader = new FileReader();
                  reader.onload = (e: any) => {
                      this.selectedImagePrev = e.target.result; // Imagen optimizada para la vista previa
                  };
                  reader.readAsDataURL(newFile);
  
                  this.selectedImage = newFile; // Usar el nuevo objeto File para subir
              },
              error: (err: any) => {
                  console.error('Error al comprimir la imagen', err);
              }
          });
      }
  }
  
  
  async onSubmit() {
      // Verificar si el formulario es válido
      if (this.addProductForm.invalid) {
          console.log('Formulario inválido', this.addProductForm.errors);
          Swal.fire({
              title: 'Error!',
              text: 'Por favor complete todos los campos requeridos.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
          });
          return;
      }
  
      // Verificar si se ha seleccionado una imagen
      if (!this.selectedImage) {
          Swal.fire({
              title: 'Error!',
              text: 'Por favor, seleccione una imagen antes de guardar el producto.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
          });
          return;
      }
  
      const formData = new FormData();
      formData.append('image', this.selectedImage); // Agregar la imagen comprimida al formData
  
      try {
          // Intentar subir la imagen y crear el producto en una sola operación
          let newImageRecord: any = await this.pb.collection('files').create(formData);
  
          if (newImageRecord) {
              console.log('Imagen subida:', newImageRecord);
  
              const files: string[] = [
                  this.apiUrl +
                  '/api/files/' +
                  newImageRecord.collectionId +
                  '/' +
                  newImageRecord.id +
                  '/' +
                  newImageRecord.image
              ];
  
              // Generar el código de barras una sola vez
              const { barcode, canvas } = this.generateBarcode();
  
              // Crear el objeto del producto con la información necesaria
              const productData = {
                name: this.addProductForm.get('name')?.value,
                price: this.addProductForm.get('price')?.value,
                idCategoria: this.addProductForm.get('idCategoria')?.value,
                description: this.addProductForm.get('description')?.value,
                barcode: barcode, // Usar el código de barras generado
                stock: Number(this.addProductForm.get('stock')?.value), // Asegurarse de convertir a número
                color: this.addProductForm.get('color')?.value,
                files: files,
                codeBarra: canvas.toDataURL() // Usar el canvas convertido a URL
              };
              
  
              // Llamar al servicio para agregar el producto
              await this.productService.createProduct(productData);
  
              Swal.fire({
                  title: 'Éxito!',
                  text: 'Producto guardado con éxito!',
                  icon: 'success',
                  confirmButtonText: 'Aceptar'
              });
  
              // Restablecer el objeto del producto
              this.product = { 
                  barcode: '',
                  name: '', 
                  price: 0, 
                  idCategoria: '', 
                  description: '', 
                  stock: 0,
                  color: '',
                  files: [],
                  codeBarra: ''
              }; 
              this.selectedImage = null; // Restablecer la imagen seleccionada
              this.productos = this.global.getProductos(); // Refrescar la lista de productos
          } else {
              Swal.fire({
                  title: 'Error!',
                  text: 'La imagen no se subió correctamente.',
                  icon: 'error',
                  confirmButtonText: 'Aceptar'
              });
          }
          this.addProductForm.reset();
          this.showForm = false;
          this.isEditing = false;
      } catch (error) {
          Swal.fire({
              title: 'Error!',
              text: 'No se pudo agregar el producto.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
          });
          console.error('Error al agregar el producto:', error);
      }
      console.log(this.addProductForm.value);
  }
  
// Método para actualizar un producto

    async updateProduct(productId: string) {
      if (!productId) {
        console.error('ID del producto no válido');
        return;
      }
    
      // Primero, obtener los datos del producto
      const product = await this.productService.getProductById(productId);
    
      // Cargar los datos del producto en el formulario
      this.addProductForm.patchValue({
        name: product.name,
        price: product.price,
        idCategoria: product.idCategoria,
        description: product.description,
        stock: product.stock,
        color: product.color,
        files: product.files,
        codeBarra: product.codeBarra,
      });
    
      // Si el producto tiene una imagen asociada, mostrarla
      if (product.files && product.files.length > 0) {
        this.selectedImagePrev = product.files[0];
      }
    
      // Mostrar el formulario de edición
      this.showForm = true;
      this.isEditing = true;
      this.currentProductId = productId;  // Asigna el ID del producto para usarlo en la actualización
    }
    
    
    async submitProductForm() {
      if (this.addProductForm.invalid) {
        console.error('Formulario inválido');
        return;
      }
    
      const updatedProduct = this.addProductForm.value;  // Obtén los valores del formulario
    
      if (!this.currentProductId) {
        console.error('ID de producto no válido');
        return;
      }
    
      try {
        // Realizar la actualización con el servicio
        await this.productService.updateProduct(this.currentProductId, updatedProduct);
    
        // Verificar que la actualización fue exitosa obteniendo el producto actualizado
        const updatedProductData = await this.productService.getProductById(this.currentProductId);
        console.log('Producto actualizado:', updatedProductData);
    
        // Cerrar el formulario después de la actualización exitosa
        this.showForm = false;  // Cierra el formulario de edición
        this.isEditing = false;  // Marca como no edición
        this.currentProductId = null;  // Limpia el ID del producto actual
    
        alert('Producto actualizado con éxito');
      } catch (error) {
        console.error('Error al actualizar el producto:', error);
      }
    }
  
  async updateProductBarcodes() {
  try {
    // 1. Obtener la lista completa de productos desde PocketBase
    const products = await this.pb.collection('productsInventoryDemo').getFullList(); 

    for (let product of products) {
      // 2. Generar un código de barras único para cada producto
      const { barcode, canvas } = this.generateBarcode();

      // 3. Preparar los datos para actualizar el producto
      const updatedProductData = {
        barcode: barcode, // Agregar el código de barras generado
        codeBarra: canvas.toDataURL(), // Agregar la imagen en formato base64
      };

      // 4. Actualizar el producto con el nuevo código de barras usando el método de actualización de PocketBase
      const recordId = product.id; // ID del producto a actualizar
      const record = await this.pb.collection('productsInventoryDemo').update(recordId, updatedProductData);

      console.log(`Producto ${product.id} actualizado con éxito`, record);
    }

    Swal.fire({
      title: 'Éxito!',
      text: 'Los productos han sido actualizados con los nuevos códigos de barras.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  } catch (error) {
    console.error('Error al actualizar los productos:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Hubo un problema al actualizar los productos. Intenta nuevamente.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

    deleteProduct(productId: string) {
    Swal.fire({
      title: '¿Está seguro?',
      text: "No podrá revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Eliminar el producto usando PocketBase
          await this.pb.collection('productsInventoryDemo').delete(productId);
          
          console.log('Producto eliminado exitosamente:', productId);
          
          // Actualizar la lista de productos
          this.realtimeProducts.products$ = from(this.pb.collection('productsInventoryDemo').getFullList());
          
          // Cancelar la edición si es necesario
          this.cancelEdit();
          
          Swal.fire(
            '¡Eliminado!',
            'El producto ha sido eliminado.',
            'success'
          );
        } catch (error: any) { // O simplemente catch (error) {
          console.error('Error al eliminar:', error.message);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el producto. Por favor, intente nuevamente.'
          });
        }
      }
    });
  }
  calculateStock(productId: string) {
    const product = this.products.find((p: any) => p.id === productId);
    if (product) {
      // Obtener el stock inicial del producto
      const initialStock = product.stock;
      
      // Calcular el total de unidades vendidas para este producto
      const totalSold = this.ventas
        .filter((ventas: any) => ventas.productId === productId)
        .reduce((total: number, ventas: any) => total + ventas.quantity, 0);
      
      // Retornar el stock actual (stock inicial - ventas totales)
      return initialStock - totalSold;
    }
    return 0;
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.addProductForm.reset();
    this.selectedImagePrev = '';  // Restablecer la vista previa de la imagen
  }
 
// Función para convertir base64 a Blob (para que pueda ser subida a PocketBase)
dataURLtoBlob(dataURL: string): Blob {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
downloadPdf(barcode: string) {
  const doc = new jsPDF();
  doc.text(`Barcode: ${barcode}`, 10, 10);
  doc.save(`${barcode}.pdf`);
}
downloadAllBarcodesPdf() {
  const doc = new jsPDF();
  this.products.forEach(product => {
    doc.text(`${product.name}: ${product.barcode}`, 10, 10 + (this.products.indexOf(product) * 10));
  });
  doc.save('barcodes.pdf');
}
scrollToProductList() {
  const productListElement = document.querySelector('.list-view');
  if (productListElement) {
      productListElement.scrollIntoView({ behavior: 'smooth' });
  }
}
}
