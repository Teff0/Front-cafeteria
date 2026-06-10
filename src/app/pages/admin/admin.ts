import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { SubcategoriaService } from '../../services/subcategoria.service';
import { ProductoResponse } from '../../models/producto.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private productoSvc     = inject(ProductoService);
  private categoriaSvc    = inject(CategoriaService);
  private subcategoriaSvc = inject(SubcategoriaService);

  productos     = signal<ProductoResponse[]>([]);
  categorias    = signal<any[]>([]);
  subcategorias = signal<any[]>([]);
  loading       = signal(true);
  error         = signal('');

  catMenu  = computed(() =>
    this.categorias().find(c => c.nombre.toLowerCase() === 'menú' || c.nombre.toLowerCase() === 'menu') ?? null
  );

  subsMenu = computed(() => {
    const cat = this.catMenu();
    if (!cat) return [];
    const orden = ['desayuno', 'almuerzo', 'cena'];
    const subs = this.subcategorias()
      .filter(s => s.categoriaId === cat.id)
      .sort((a, b) => orden.indexOf(a.nombre.toLowerCase()) - orden.indexOf(b.nombre.toLowerCase()));
    // Deduplica por nombre — si hay duplicados sólo muestra uno por categoría
    const seen = new Set<string>();
    return subs.filter(s => {
      const key = s.nombre.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  productosMenu = computed(() => {
    const id = this.catMenu()?.id;
    return id ? this.productos().filter(p => p.categoriaId === id) : [];
  });

  productosSinSub = computed(() => {
    const subIds = new Set(this.subcategorias().map(s => s.id));
    return this.productosMenu().filter(p => !p.subcategoriaId || !subIds.has(p.subcategoriaId));
  });

  /* ── Categorías extras (Bebidas, Frutas, Snacks) ── */
  readonly OTRAS_CATS = ['Bebidas', 'Frutas', 'Snacks'];

  catsOtras = computed(() => {
    const menuId = this.catMenu()?.id;
    return this.categorias().filter(c =>
      c.id !== menuId &&
      this.OTRAS_CATS.map(n => n.toLowerCase()).includes(c.nombre.toLowerCase())
    );
  });

  productosOtros = computed(() => {
    const menuId = this.catMenu()?.id;
    return this.productos().filter(p => p.categoriaId !== menuId);
  });

  /* ── Tabs ── */
  tabActiva = signal<'menu' | 'productos'>('menu');

  /* ── Formulario menú ── */
  nuevo     = signal({ nombre: '', descripcion: '', precio: 0, stock: 0, subcategoriaId: '', imagenUrl: '' });
  saving    = signal(false);
  errorForm = signal('');
  prevImg   = signal('');

  /* ── Formulario otras categorías ── */
  nuevoOtro     = signal({ nombre: '', descripcion: '', precio: 0, stock: 0, categoriaId: '', imagenUrl: '' });
  savingOtro    = signal(false);
  errorFormOtro = signal('');
  prevImgOtro   = signal('');

  /* ── Edición en tabla ── */
  editando    = signal<ProductoResponse | null>(null);
  prevEdicion = signal('');

  /** Todos los productos del menú cuya subcategoría tenga este nombre (agrupa duplicados) */
  prodsPorMeal(nombreSub: string): ProductoResponse[] {
    const cat = this.catMenu();
    if (!cat) return [];
    const ids = new Set(
      this.subcategorias()
        .filter(s => s.categoriaId === cat.id && s.nombre.toLowerCase() === nombreSub.toLowerCase())
        .map((s: any) => s.id)
    );
    return this.productos().filter(p => p.categoriaId === cat.id && ids.has(p.subcategoriaId));
  }

  imgSrc(url: string) { return url?.startsWith('/') ? `http://localhost:8080${url}` : url; }

  ngOnInit() { this.cargarTodo(); }

  async cargarTodo() {
    this.loading.set(true);
    this.error.set('');
    try {
      const cats = await firstValueFrom(this.categoriaSvc.getAll());
      this.categorias.set(cats);
      const subs = await firstValueFrom(this.subcategoriaSvc.getAll());
      this.subcategorias.set(subs);
      await this.initMenuStructure();
      const prods = await firstValueFrom(this.productoSvc.getAll());
      this.productos.set(prods);
      this.loading.set(false);
    } catch {
      this.error.set('Error al cargar datos.');
      this.loading.set(false);
    }
  }

  async initMenuStructure() {
    let catMenu = this.categorias().find(c =>
      c.nombre.toLowerCase() === 'menú' || c.nombre.toLowerCase() === 'menu'
    );
    if (!catMenu) {
      catMenu = await firstValueFrom(
        this.categoriaSvc.create({ nombre: 'Menú', descripcion: 'Menú de la cafetería', activo: true })
      );
      this.categorias.update(l => [...l, catMenu]);
    }

    const subs = this.subcategorias().filter(s => s.categoriaId === catMenu.id);
    for (const nombre of ['Desayuno', 'Almuerzo', 'Cena']) {
      if (!subs.find((s: any) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
        const sub = await firstValueFrom(
          this.subcategoriaSvc.crear({ categoriaId: catMenu.id, nombre, descripcion: '' })
        );
        this.subcategorias.update(l => [...l, sub]);
        subs.push(sub);
      }
    }

    // Auto-crear Bebidas, Frutas, Snacks si no existen
    for (const nombre of this.OTRAS_CATS) {
      const existe = this.categorias().find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
      if (!existe) {
        const cat = await firstValueFrom(
          this.categoriaSvc.create({ nombre, descripcion: '', activo: true })
        );
        this.categorias.update(l => [...l, cat]);
      }
    }
  }

  onImagen(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.prevImg.set(ev.target!.result as string);
    reader.readAsDataURL(file);
    this.productoSvc.uploadImagen(file).subscribe({
      next: res => this.nuevo.update(n => ({ ...n, imagenUrl: res.url })),
      error: () => this.errorForm.set('No se pudo subir la imagen.')
    });
  }

  guardar() {
    const n = this.nuevo();
    const cat = this.catMenu();
    this.errorForm.set('');
    if (!n.nombre.trim())   { this.errorForm.set('El nombre es obligatorio.'); return; }
    if (!n.precio)          { this.errorForm.set('El precio es obligatorio.'); return; }
    if (!n.subcategoriaId)  { this.errorForm.set('Selecciona una categoría del menú.'); return; }
    if (!cat)               { this.errorForm.set('Error interno: no existe la categoría Menú.'); return; }
    this.saving.set(true);
    this.productoSvc.crear({
      nombre: n.nombre, descripcion: n.descripcion,
      precio: n.precio, stock: n.stock || 1,
      imagenUrl: n.imagenUrl, categoriaId: cat.id,
      subcategoriaId: n.subcategoriaId, disponible: true
    }).subscribe({
      next: p => {
        this.productos.update(l => [...l, p]);
        this.nuevo.set({ nombre: '', descripcion: '', precio: 0, stock: 0, subcategoriaId: n.subcategoriaId, imagenUrl: '' });
        this.prevImg.set('');
        this.saving.set(false);
      },
      error: () => { this.errorForm.set('Error al guardar. Intenta de nuevo.'); this.saving.set(false); }
    });
  }

  onImagenOtro(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.prevImgOtro.set(ev.target!.result as string);
    reader.readAsDataURL(file);
    this.productoSvc.uploadImagen(file).subscribe({
      next: res => this.nuevoOtro.update(n => ({ ...n, imagenUrl: res.url })),
      error: () => this.errorFormOtro.set('No se pudo subir la imagen.')
    });
  }

  guardarOtro() {
    const n = this.nuevoOtro();
    this.errorFormOtro.set('');
    if (!n.nombre.trim()) { this.errorFormOtro.set('El nombre es obligatorio.'); return; }
    if (!n.precio)        { this.errorFormOtro.set('El precio es obligatorio.'); return; }
    if (!n.categoriaId)   { this.errorFormOtro.set('Selecciona una categoría.'); return; }
    this.savingOtro.set(true);
    this.productoSvc.crear({
      nombre: n.nombre, descripcion: n.descripcion,
      precio: n.precio, stock: n.stock || 1,
      imagenUrl: n.imagenUrl, categoriaId: n.categoriaId, disponible: true
    }).subscribe({
      next: p => {
        this.productos.update(l => [...l, p]);
        this.nuevoOtro.set({ nombre: '', descripcion: '', precio: 0, stock: 0, categoriaId: n.categoriaId, imagenUrl: '' });
        this.prevImgOtro.set('');
        this.savingOtro.set(false);
      },
      error: () => { this.errorFormOtro.set('Error al guardar. Intenta de nuevo.'); this.savingOtro.set(false); }
    });
  }

  iniciarEdicion(p: ProductoResponse) { this.editando.set({ ...p }); this.prevEdicion.set(''); }
  cancelarEdicion()                   { this.editando.set(null); this.prevEdicion.set(''); }

  onImagenEdicion(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.prevEdicion.set(ev.target!.result as string);
    reader.readAsDataURL(file);
    this.productoSvc.uploadImagen(file).subscribe({
      next: res => this.editando.update(p => p ? { ...p, imagenUrl: res.url } : p)
    });
  }

  guardarEdicion() {
    const p = this.editando();
    if (!p) return;
    this.saving.set(true);
    this.productoSvc.update(p.id, {
      nombre: p.nombre, descripcion: p.descripcion,
      precio: p.precio, stock: p.stock,
      categoriaId: p.categoriaId, subcategoriaId: p.subcategoriaId,
      imagenUrl: p.imagenUrl, disponible: p.disponible
    }).subscribe({
      next: u => { this.productos.update(l => l.map(x => x.id === u.id ? u : x)); this.editando.set(null); this.saving.set(false); },
      error: () => this.saving.set(false)
    });
  }

  eliminarProducto(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productoSvc.delete(id).subscribe({ next: () => this.productos.update(l => l.filter(x => x.id !== id)) });
  }

  eliminarTodosSinSub() {
    const lista = this.productosSinSub();
    if (!lista.length || !confirm(`¿Eliminar los ${lista.length} productos sin categoría?`)) return;
    lista.forEach(p => this.productoSvc.delete(p.id).subscribe({
      next: () => this.productos.update(l => l.filter(x => x.id !== p.id))
    }));
  }

  toggleDisponible(id: string, disponible: boolean) {
    this.productoSvc.setDisponible(id, !disponible).subscribe({
      next: p => this.productos.update(l => l.map(x => x.id === id ? p : x))
    });
  }
}
