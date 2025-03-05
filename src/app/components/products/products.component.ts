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
import { from } from 'rxjs';
import { BarcodeComponent } from '../barcode/barcode.component';
import JsBarcode from 'jsbarcode'; // Use default import
import { ProductService } from '../../services/product.service';
import PocketBase from 'pocketbase';


export interface PocketBaseError {
  message: string;
  // otras propiedades que puedas necesitar
}
export interface Product {
  name: string;
  price: number;
  barcode: string;
  idCategoria: string;
  description: string;
  unity: number; // Change from string to number
  stock: number;
  color: string;
  files: string[];
  codeBarra: string;
}
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    BarcodeComponent
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  private pb: PocketBase;
  private apiUrl = 'https://db.buckapi.lat:8095';
  showForm = false;
  /* productForm: FormGroup; */
  previewImage: string = 'assets/images/thumbs/setting-profile-img.jpg';
  products: any[] = []; // Changed Product to any[] since Product type is not defined
  products$: any;
  isEditing = false;
  currentProductId: string = '';
  showFilter = false;
  ventas: any[] = [];
  imagePreview: string | null = null; // Para mostrar la vista previa de la imagen
  selectedFile: File | null = null;
  selectedCategory: string = ''; // Default category
  searchQuery: string = ''; // Default search query
  productosFiltrados: any[] = [];
  productos$: any;
  searchTerm: string = '';
  product = {
    name: '',
    price: 0, // Change to string
    idCategoria: '', // Include categorias
    description: '', // Include description
    files: [] , // Include files as an array
   /*  unity: 0, */
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
  
    this.realtimeProducts.products$.subscribe((products) => {
      this.global.productos = products;
    });
    this.pb = new PocketBase(this.apiUrl);
    this.addProductForm = this.fb.group({
      name: [''],
      price: [''],
      stock: [''],
      idCategoria: [''],
      description: [''],
      files: [''],
      unity: [''],
      color: [''],
      codeBarra: ['']
    });
  
    
  }
  ngOnInit() {
    this.loadProducts();
    this.global.applyFilters(this.selectedCategory, this.searchQuery); // Initial call to set up default view
}
  
    loadProducts() {
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
    }
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
     /*  unity: 1, */
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
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImagePrev = e.target.result;
      };
      reader.readAsDataURL(file);
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
    formData.append('image', this.selectedImage); // Agregar la imagen al formData

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
                stock: this.addProductForm.get('stock')?.value,
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
async updateProductBarcodes() {
  try {
    // 1. Obtener la lista completa de productos desde PocketBase
    const products = await this.pb.collection('productsInventory').getFullList(); 

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
      const record = await this.pb.collection('productsInventory').update(recordId, updatedProductData);

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
          await this.pb.collection('productsInventory').delete(productId);
          
          console.log('Producto eliminado exitosamente:', productId);
          
          // Actualizar la lista de productos
          this.realtimeProducts.products$ = from(this.pb.collection('productsInventory').getFullList());
          
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
    this.imagePreview = '';
  }
 
  onImageSelect(event: any) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result; // For preview
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

async uploadImageToServer(): Promise<{ url: string }> {
try {
  if (!this.selectedFile) {
    throw new Error('No image selected');
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  const response = await this.uploadService.pb.collection('files').create(formData);

  if (response && response['file']) {
    return { url: this.uploadService.pb.files.getUrl(response, response['file']) };
  } else {
    throw new Error('Failed to upload image');
  }
} catch (error) {
  console.error('Error uploading image:', error);
  throw error;
}
}

async uploadImageToServerCorrected(): Promise<{ url: string }> {
try {
  if (!this.selectedFile) {
    throw new Error('No image selected');
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  const response = await this.uploadService.pb.collection('files').create(formData);

  if (response && response['file']) {
    return { url: this.uploadService.pb.files.getUrl(response, response['file']) };
  } else {
    throw new Error('Failed to upload image');
  }
} catch (error) {
  console.error('Error uploading image:', error);
  throw error;
}
}

async optimizeAndUpdateImages() {
  try {
    // Paso 1: Obtener todos los productos de la colección productsInventory
    const products = await this.pb.collection('productsInventory').getFullList();

    // Paso 2: Iterar sobre cada producto y optimizar su imagen
    for (let product of products) {
      if (product['files'] && product['files'].length > 0) {
        const imageUrl = product['files'][0]; // URL de la imagen actual desde la colección 'files'
        
        // Paso 3: Descargar la imagen desde la URL de la colección 'files'
        const img = await this.loadImageFromUrl(imageUrl);

        // Paso 4: Optimizar la imagen utilizando Canvas
        const optimizedImage = await this.optimizeImage(img);

        // Paso 5: Convertir la imagen optimizada a un formato adecuado para PocketBase (base64 -> Blob)
        const formData = new FormData();
        const blob = this.dataURLtoBlob(optimizedImage);
        formData.append('file', blob, 'optimized-image.jpg');

        // Paso 6: Subir la imagen optimizada a PocketBase (colección 'files')
        const response = await this.pb.collection('files').create(formData);

        // Paso 7: Actualizar el producto con la nueva URL de la imagen optimizada
        const updatedProductData = {
          files: [response['file']] // Suponiendo que 'file' es el nombre de la imagen subida
        };

        // Actualizar el producto en PocketBase
        await this.pb.collection('productsInventory').update(product.id, updatedProductData);

        console.log(`Producto ${product['name']} actualizado con la imagen optimizada.`);
      }
    }

    Swal.fire({
      title: 'Éxito!',
      text: 'Las imágenes han sido optimizadas y actualizadas con éxito.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  } catch (error) {
    console.error('Error al optimizar las imágenes:', error);
    Swal.fire({
      title: 'Error!',
      text: 'Hubo un problema al optimizar las imágenes. Intenta nuevamente.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Función para descargar una imagen desde una URL
loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Asegurarnos de que no haya problemas con CORS si es necesario
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

// Función para optimizar la imagen usando Canvas
async optimizeImage(img: HTMLImageElement): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Ajustar las dimensiones de la imagen
  const MAX_WIDTH = 800;  // Cambia el valor según sea necesario
  const MAX_HEIGHT = 800; // Cambia el valor según sea necesario
  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > MAX_WIDTH) {
      height = (height * MAX_WIDTH) / width;
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width = (width * MAX_HEIGHT) / height;
      height = MAX_HEIGHT;
    }
  }

  // Establecer las dimensiones del canvas
  canvas.width = width;
  canvas.height = height;

  // Dibujar la imagen en el canvas con las nuevas dimensiones
  ctx?.drawImage(img, 0, 0, width, height);

  // Convertir la imagen optimizada a base64 con calidad reducida (por ejemplo, 0.7 para compresión)
  return canvas.toDataURL('image/jpeg', 0.7); // Puedes ajustar la calidad según lo necesites
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

}
