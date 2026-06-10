import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { PedidoResponse } from '../../models/pedido.model';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  carrito     = inject(CarritoService);
  pedidoSvc   = inject(PedidoService);
  productoSvc = inject(ProductoService);
  router      = inject(Router);

  step             = signal<'checkout' | 'paying' | 'done'>('checkout');
  metodoPago       = signal<'YAPE' | 'PLIN'>('YAPE');
  loading          = signal(false);
  error            = signal('');
  pedidoActual     = signal<PedidoResponse | null>(null);

  voucherFile      = signal<File | null>(null);
  voucherPreview   = signal('');
  uploadingVoucher = signal(false);
  errorVoucher     = signal('');

  historial    = signal<PedidoResponse[]>([]);
  loadingHist  = signal(true);
  cancelando   = signal<string | null>(null);

  /** Estados en los que el cliente todavía puede cancelar su pedido */
  puedeCancelar(estado: string): boolean {
    return estado === 'PENDIENTE' || estado === 'PAGADO';
  }

  readonly YAPE_NUMERO = '987 654 321';
  readonly PLIN_NUMERO = '987 654 321';

  pagoNumero = computed(() =>
    this.metodoPago() === 'YAPE' ? this.YAPE_NUMERO : this.PLIN_NUMERO
  );

  ngOnInit() {
    this.pedidoSvc.getMisPedidos().subscribe({
      next: p  => { this.historial.set(p); this.loadingHist.set(false); },
      error: () => this.loadingHist.set(false)
    });
  }

  selMetodo(m: 'YAPE' | 'PLIN') { this.metodoPago.set(m); }

  crearPedido() {
    if (!this.carrito.items().length) return;
    this.loading.set(true);
    this.error.set('');

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const body = {
      metodoPago: this.metodoPago(),
      items: this.carrito.items().map(i => ({ productoId: i.producto.id, cantidad: i.cantidad })),
      horaProgramada: `${hh}:${mm}:${ss}`,
    };

    this.pedidoSvc.crear(body).subscribe({
      next: pedido => {
        this.pedidoActual.set(pedido);
        this.carrito.vaciar();
        this.step.set('paying');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo crear el pedido. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onVoucherFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.voucherFile.set(file);
    this.errorVoucher.set('');
    const reader = new FileReader();
    reader.onload = e => this.voucherPreview.set(e.target!.result as string);
    reader.readAsDataURL(file);
  }

  enviarVoucher() {
    const file = this.voucherFile();
    const pedido = this.pedidoActual();
    if (!file || !pedido) {
      this.errorVoucher.set('Debes seleccionar una imagen del comprobante de pago.');
      return;
    }
    this.uploadingVoucher.set(true);
    this.errorVoucher.set('');

    this.productoSvc.uploadImagen(file).subscribe({
      next: ({ url }) => {
        this.pedidoSvc.subirVoucher(pedido.id, url).subscribe({
          next: p => {
            this.pedidoActual.set(p);
            this.historial.update(list => [p, ...list.filter(x => x.id !== p.id)]);
            this.step.set('done');
            this.uploadingVoucher.set(false);
          },
          error: () => {
            this.errorVoucher.set('No se pudo registrar el comprobante. Intenta de nuevo.');
            this.uploadingVoucher.set(false);
          }
        });
      },
      error: () => {
        this.errorVoucher.set('Error al subir la imagen. Intenta de nuevo.');
        this.uploadingVoucher.set(false);
      }
    });
  }

  nuevoPedido() {
    this.step.set('checkout');
    this.pedidoActual.set(null);
    this.voucherFile.set(null);
    this.voucherPreview.set('');
    this.router.navigate(['/menu']);
  }

  cancelarPedido(p: PedidoResponse) {
    const pagado = p.estado === 'PAGADO';
    const msg = pagado
      ? `¿Cancelar el pedido #${p.numeroPedido}? Como ya está pagado, se procesará la devolución de S/ ${p.total.toFixed(2)}.`
      : `¿Cancelar el pedido #${p.numeroPedido}?`;
    if (!confirm(msg)) return;

    this.cancelando.set(p.id);
    this.pedidoSvc.cancelar(p.id).subscribe({
      next: actualizado => {
        this.historial.update(list => list.map(x => x.id === actualizado.id ? actualizado : x));
        this.cancelando.set(null);
      },
      error: err => {
        alert(err?.error?.message ?? 'No se pudo cancelar el pedido.');
        this.cancelando.set(null);
      }
    });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE:      'Pendiente de pago',
      PAGADO:         'Pago en verificación',
      EN_PREPARACION: 'En preparación',
      LISTO:          'Listo para recoger',
      ENTREGADO:      'Entregado',
      CANCELADO:      'Cancelado',
    };
    return map[estado] ?? estado;
  }

  imgUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `http://localhost:8080${url}` : url;
  }
}
