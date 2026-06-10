import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { SubcategoriaService } from '../../services/subcategoria.service';
import { CarritoService } from '../../services/carrito.service';
import { ProductoResponse } from '../../models/producto.model';
import { CategoriaResponse } from '../../models/categoria.model';

@Component({
  selector: 'app-menu',
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu implements OnInit {
  private productoService    = inject(ProductoService);
  private categoriaService   = inject(CategoriaService);
  private subcategoriaService = inject(SubcategoriaService);
  carritoService             = inject(CarritoService);

  categorias    = signal<CategoriaResponse[]>([]);
  subcategorias = signal<any[]>([]);
  productos     = signal<ProductoResponse[]>([]);
  catActiva     = signal('');
  subActiva     = signal('');
  busqueda      = signal('');
  selProductos  = signal<Set<string>>(new Set());
  loading       = signal(true);
  error         = signal('');
  sidebarOpen   = signal(false);

  catMenu = computed(() =>
    this.categorias().find(c => c.nombre.toLowerCase() === 'menú' || c.nombre.toLowerCase() === 'menu') ?? null
  );

  esMenuActivo = computed(() => !!this.catMenu() && this.catActiva() === this.catMenu()!.id);

  subsDeMenu = computed(() => {
    const cat = this.catMenu();
    if (!cat) return [];
    const orden = ['desayuno', 'almuerzo', 'cena'];
    const subs = this.subcategorias()
      .filter(s => s.categoriaId === cat.id)
      .sort((a: any, b: any) => orden.indexOf(a.nombre.toLowerCase()) - orden.indexOf(b.nombre.toLowerCase()));
    const seen = new Set<string>();
    return subs.filter((s: any) => {
      const key = s.nombre.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  });

  productosPorCat = computed(() => {
    if (this.subActiva()) return this.productos().filter(p => p.subcategoriaId === this.subActiva());
    return this.catActiva()
      ? this.productos().filter(p => p.categoriaId === this.catActiva())
      : this.productos();
  });

  filtrados = computed(() => {
    let lista = this.subActiva()
      ? this.productos().filter(p => p.subcategoriaId === this.subActiva())
      : this.catActiva()
        ? this.productos().filter(p => p.categoriaId === this.catActiva())
        : this.productos();
    const q = this.busqueda().toLowerCase().trim();
    if (q) lista = lista.filter(p =>
      p.nombre.toLowerCase().includes(q) || (p.descripcion ?? '').toLowerCase().includes(q)
    );
    const sel = this.selProductos();
    if (sel.size) lista = lista.filter(p => sel.has(p.id));
    return lista;
  });

  ngOnInit() {
    this.categoriaService.getAll().subscribe({
      next: cats => this.categorias.set(cats.filter(c => c.activo))
    });
    this.subcategoriaService.getAll().subscribe({
      next: subs => this.subcategorias.set(subs)
    });
    this.productoService.getAvailable().subscribe({
      next: p  => { this.productos.set(p); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los productos.'); this.loading.set(false); }
    });
  }

  seleccionarCat(id: string) {
    this.catActiva.set(id);
    this.subActiva.set('');
    this.selProductos.set(new Set());
  }

  seleccionarSub(id: string) {
    this.subActiva.set(this.subActiva() === id ? '' : id);
    this.selProductos.set(new Set());
  }

  toggleProducto(id: string) {
    this.selProductos.update(s => {
      const c = new Set(s);
      c.has(id) ? c.delete(id) : c.add(id);
      return c;
    });
  }

  limpiarFiltros() {
    this.catActiva.set('');
    this.subActiva.set('');
    this.selProductos.set(new Set());
  }

  hayFiltros = computed(() => !!this.catActiva() || !!this.subActiva() || this.selProductos().size > 0);

  buscar(q: string)            { this.busqueda.set(q); }
  agregar(p: ProductoResponse) { this.carritoService.agregar(p); }
  cantidadEnCarrito(id: string): number {
    return this.carritoService.items().find(i => i.producto.id === id)?.cantidad ?? 0;
  }
  imgUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:8080${url}` : url;
  }
}
