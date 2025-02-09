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
  showForm = false;
  productForm: FormGroup;
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
  private pb: PocketBase;
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
    this.pb = new PocketBase('https://db.buckapi.com:8095'); // Inicializa PocketBase

    this.realtimeProducts.products$ = from(this.pb.collection('productsInventory').getFullList());

    // Configurar el formulario con validadores
    this.productForm = this.fb.group({
      idCategoria: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      unity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      color: ['', Validators.required],
      file: [null]
    });
  }
  ngOnInit() {
    this.loadProducts();
    this.global.applyFilters(this.selectedCategory, this.searchQuery); // Initial call to set up default view
}
  /* loadProducts() {
    this.realtimeProducts.products$.subscribe((products: any[]) => {
      // Load products if needed
    });
  } */
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
    this.productForm.reset();
    this.previewImage = 'assets/images/thumbs/setting-profile-img.jpg';
    // Set default values if needed
    this.productForm.patchValue({
      unity: 1,
      price: 0,
      /* code: 123, */
      stock: 0,
      color: '', // Reiniciar el campo "color"
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
      height: 40,
      displayValue: true
    });
    return canvas.toDataURL('image/png'); // Regresa la imagen en formato base64
  }
  addProduct() {
    if (this.productForm.invalid) {
      console.log('Formulario inválido', this.productForm.errors);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos.'
      });
      return;
    }
  
    // Prepara los datos del producto
    const productData = {
      name: this.productForm.get('name')?.value,
      description: this.productForm.get('description')?.value,
      unity: this.productForm.get('unity')?.value,
      price: this.productForm.get('price')?.value,
      stock: this.productForm.get('stock')?.value,
      color: this.productForm.get('color')?.value,
      codeBarra: this.generateBarcode(), // Genera el código de barras único
      idCategoria: this.productForm.get('idCategoria')?.value,
    };
  
    // Llama al servicio de carga de imágenes
    if (this.selectedFile) {
      this.uploadService.uploadAndCreateProduct(this.selectedFile, productData).subscribe({
        next: (result) => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Producto guardado correctamente'
          });
          this.resetForm(); // Resetear el formulario
          this.loadProducts(); // Actualiza la lista de productos
        },
        error: (error) => {
          console.error('Error al guardar el producto:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar el producto. Por favor, intente nuevamente.'
          });
        }
      });
    } else {
      // Si no hay imagen, guarda el producto sin imagen
      this.saveProduct(productData);
    }
  }
  private resetForm() {
    this.productForm.reset();
    this.showForm = false;
    this.selectedFile = null;
    this.imagePreview = null;
}
async saveProduct(productData: any) {
  try {
      const record = await this.uploadService.pb.collection('productsInventory').create(productData);
      console.log('Producto guardado correctamente:', record);
      Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Producto guardado correctamente'
      });
      this.resetForm(); // Resetear el formulario
      this.loadProducts(); // Actualiza la lista de productos
  } catch (error) {
      console.error('Error al guardar el producto:', error);
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el producto. Por favor, intente nuevamente.'
      });
  }
}    
  
  updateProduct(productId: string) {
    this.currentProductId = productId;
    this.showForm = true;
    this.isEditing = true;

    // Obtener el producto actual y llenar el formulario
    this.realtimeProducts.products$.subscribe(products => {
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        this.productForm.patchValue({
          name: product.name,
/*           code: product.code,
 */          description: product.description,
          unity: product.unity,
          price: product.price,
          idCategoria: product.idCategoria,
          stock: product.stock,
          color: product.color,
          file: product.file,
          codeBarra: product.codeBarra
        });

        if (product.image) {
          this.imagePreview = product.image;
        }
      }
    });
  }
  async saveupdateProduct(productData: any) {
    try {
      // Crear un FormData para enviar el producto
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('price', productData.price);
      formData.append('code', productData.code);
      formData.append('unity', productData.unity);
      formData.append('description', productData.description);
      formData.append('idCategoria', productData.idCategoria);
      formData.append('stock', productData.stock);
      formData.append('color', productData.color); // Incluir el campo "color"
      formData.append('codeBar', productData.codeBar);
      formData.append('codeBarra', productData.codeBarra);
  
      // Si existe un archivo, lo agregamos al FormData
      if (productData.file) {
        formData.append('file', productData.file);
      }
  
      // Intentar actualizar el producto
      const record = await this.uploadService.pb.collection('productsInventory').update(this.currentProductId, formData);
  
      // Actualizar la lista de productos en tiempo real si es necesario
      this.realtimeProducts.products$ = from(this.uploadService.pb.collection('productsInventory').getFullList());
  
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Producto actualizado correctamente'
      });
  
      // Actualizar los datos en el formulario para reflejar los cambios
      this.productForm.patchValue({
        name: productData.name,
        price: productData.price,
        code: productData.code,
        unity: productData.unity,
        description: productData.description,
        idCategoria: productData.idCategoria,
        stock: productData.stock,
        color: productData.color, // Incluir el campo "color"
        codeBar: productData.codeBar,
        codeBarra: productData.codeBarra
      });
  
      // Cerrar el formulario de edición
      this.productForm.reset();
      this.showForm = false;
      this.isEditing = false;
  
    } catch (error) {
      console.error('Error al actualizar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el producto. Por favor, intente nuevamente.'
      });
    }
  }
  
  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.productForm.reset();
    this.imagePreview = '';
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
