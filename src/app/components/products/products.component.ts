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
    codeBarra: ''
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
  generateBarcode(): string {
    const barcode = Math.random().toString(36).substr(2, 9);
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      lineColor: "#0aa",
      width: 4,
      height: 250,
      displayValue: true
    });
    return canvas.toDataURL('image/png'); // Regresa la imagen en formato base64
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
  
              // Crear el objeto del producto con la información necesaria
              const productData = {
                  name: this.addProductForm.get('name')?.value,
                  price: this.addProductForm.get('price')?.value,
                  idCategoria: this.addProductForm.get('idCategoria')?.value,
                  description: this.addProductForm.get('description')?.value,
                  /* unity: this.addProductForm.get('unity')?.value, */
                  stock: this.addProductForm.get('stock')?.value,
                  color: this.addProductForm.get('color')?.value,
                  files: files,
                  codeBarra: this.generateBarcode() // Asegúrate de que este método esté definido
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
                  name: '', 
                  price: 0, 
                  idCategoria: '', 
                  description: '', 
                  /* unity: 0, */
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
}
