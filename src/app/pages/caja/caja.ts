import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';
import { PedidoResponse } from '../../models/pedido.model';

@Component({
  selector: 'app-caja',
  imports: [CommonModule],
  templateUrl: './caja.html',
  styleUrl: './caja.scss',
})
export class Caja implements OnInit {
  private pedidoSvc = inject(PedidoService);

  pedidos    = signal<PedidoResponse[]>([]);
  loading    = signal(true);
  error      = signal('');
  procesando = signal<string | null>(null);

  pagados = computed(() => this.pedidos().filter(p => p.estado === 'PAGADO'));
  enPrep  = computed(() => this.pedidos().filter(p => p.estado === 'EN_PREPARACION'));
  listos  = computed(() => this.pedidos().filter(p => p.estado === 'LISTO'));

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.pedidoSvc.getPendientes().subscribe({
      next: p  => { this.pedidos.set(p); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar pedidos.'); this.loading.set(false); }
    });
  }

  cambiar(id: string, nuevoEstado: string) {
    this.procesando.set(id);
    this.pedidoSvc.cambiarEstado(id, nuevoEstado).subscribe({
      next: p => {
        if (nuevoEstado === 'ENTREGADO') {
          this.pedidos.update(list => list.filter(x => x.id !== id));
        } else {
          this.pedidos.update(list => list.map(x => x.id === id ? p : x));
        }
        this.procesando.set(null);
      },
      error: () => this.procesando.set(null)
    });
  }

  imgUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:8080${url}` : url;
  }
}
