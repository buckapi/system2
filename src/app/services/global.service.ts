import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { RealtimeCategoriasService } from './realtime-categorias.service';
import { RealtimeProductsService } from './realtime-productos.service';
import { take } from 'rxjs/operators';

interface Categoria {
  id: string;
  name: string;
  repositories: Categoria[];
}
@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  activeRoute = 'login';
  filteredProducts: any[] = [];
  selectedCategory: string = '';
  searchQuery: string = '';
  productosFiltrados: any[] = [];
  productos: any[] = [];
  searchTerm: string = '';

  constructor(
    public realtimeCategorias: RealtimeCategoriasService,
    public realtimeProducts: RealtimeProductsService
  ) { 
    this.realtimeProducts.products$.subscribe((products: any) => {
      this.productos = products;
      this.productosFiltrados = [...products]; // Inicialmente muestra todos los productos
      console.log('Productos cargados:', this.productos); // Para debugging
    });
  }
  setRoute(route: string) {
    this.activeRoute = route;
  }
  showToast(message: string, type: string) {
    const title = type === 'error' ? 'Error' : 
                  type === 'success' ? 'Éxito' :
                  type === 'warning' ? 'Advertencia' : 'Información';
                  
    Swal.fire({   
      title: title,
      text: message,
      icon: type as any,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }
  filterProducts(products: any[], category: number) {
    if (category === 0) {
        return products; // Ensure this is an array
    }
    return products.filter((product: any) => product.idCategoria === category);
  }
  applyFilters(selectedCategoria: string, searchQuery: string) {
    this.realtimeProducts.products$.pipe(take(1)).subscribe((products: any[]) => {
      this.filteredProducts = products.filter((product: any) => {
        // Check if selectedCategoria is not empty and if so, check if it matches any category of the product
        let matchesCategoria = selectedCategoria ? 
            product.categorias.some((c: Categoria) => c.id === selectedCategoria) : true;
        
        // Check if searchQuery is not empty and if so, check if it matches the entity field of the product
        let matchesSearchText = searchQuery ? 
            product.subject.toLowerCase().includes(searchQuery.toLowerCase()) : true;
        
        // Return true if both conditions are met
        return matchesCategoria && matchesSearchText;
      });
    });
  }
  resetFilters() {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.applyFilters(this.selectedCategory, this.searchQuery); // Call the method to apply filters();
  }
  filtrarProductos(termino: string) {
    if (!termino) {
      this.productosFiltrados = [...this.productos];
      return;
    }

    termino = termino.toLowerCase();
    this.productosFiltrados = this.productos.filter(producto => 
      producto.name.toLowerCase().includes(termino) || 
      producto.code.toLowerCase().includes(termino)
    );
    console.log('Productos filtrados:', this.productosFiltrados); // Para debugging
  }
  onSearchChange(event: any) {
    const termino = event.target.value;
    console.log('Término de búsqueda:', termino); // Para debugging
    this.filtrarProductos(termino);
  }
  getProductos(): any[] {
    return this.productos;
  }
}
