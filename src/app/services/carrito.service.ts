import { Injectable, signal, computed } from '@angular/core';
import { ProductoResponse } from '../models/producto.model';
import { CarritoItem } from '../models/carrito.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private _items = signal<CarritoItem[]>([]);

  readonly items    = this._items.asReadonly();
  readonly total    = computed(() => this._items().reduce((s, i) => s + i.producto.precio * i.cantidad, 0));
  readonly cantidad = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));

  agregar(producto: ProductoResponse) {
    this._items.update(items => {
      const existe = items.find(i => i.producto.id === producto.id);
      if (existe) {
        if (existe.cantidad >= producto.stock) return items;
        return items.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      if (producto.stock <= 0) return items;
      return [...items, { producto, cantidad: 1 }];
    });
  }

  incrementar(productoId: string) {
    this._items.update(items => items.map(i => {
      if (i.producto.id !== productoId) return i;
      if (i.cantidad >= i.producto.stock) return i;
      return { ...i, cantidad: i.cantidad + 1 };
    }));
  }

  decrementar(productoId: string) {
    this._items.update(items =>
      items.map(i => i.producto.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i)
           .filter(i => i.cantidad > 0)
    );
  }

  eliminar(productoId: string) {
    this._items.update(items => items.filter(i => i.producto.id !== productoId));
  }

  vaciar() { this._items.set([]); }

  cambiarCantidad(productoId: string, cantidad: number) {
    if (cantidad <= 0) { this.eliminar(productoId); return; }
    this._items.update(items => items.map(i => i.producto.id === productoId ? { ...i, cantidad } : i));
  }
}
