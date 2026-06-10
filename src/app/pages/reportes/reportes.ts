import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService, ReporteVentas } from '../../services/reportes.service';
import { PedidoService } from '../../services/pedido.service';
import { PedidoResponse } from '../../models/pedido.model';

interface DonutSegment {
  label:   string;
  value:   number;
  percent: number;
  color:   string;
  dash:    string;
  offset:  number;
}

interface LinePoint { x: number; y: number; fecha: string; total: number; label: string; show: boolean; }

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes implements OnInit {
  private reportesSvc = inject(ReportesService);
  private pedidoSvc   = inject(PedidoService);

  /* ── Datos del endpoint /reports/sales ── */
  ventas        = signal<ReporteVentas | null>(null);
  loadingVentas = signal(true);
  errorVentas   = signal('');
  descargando   = signal<string | null>(null);

  /* ── Datos derivados de /orders (analítica) ── */
  pedidos        = signal<PedidoResponse[]>([]);
  loadingPedidos = signal(true);
  errorPedidos   = signal('');

  /* ── Filtros ── */
  fechaInicio = signal(this.primerDiaMes());
  fechaFin    = signal(this.hoy());

  /* ── Constante geométrica del donut (2·π·r, r=54) ── */
  private readonly DONUT_C = 339.292;

  /* ── Pedidos dentro del rango de fechas ── */
  pedidosFiltrados = computed(() => {
    const ini = this.fechaInicio();
    const fin = this.fechaFin();
    return this.pedidos().filter(p => {
      const d = this.dateOnly(p.createdAt);
      return d >= ini && d <= fin;
    });
  });

  /** Ventas reales = pedidos no cancelados */
  ventasValidas = computed(() => this.pedidosFiltrados().filter(p => p.estado !== 'CANCELADO'));

  /* ── KPIs extra ── */
  descuentoTotal = computed(() =>
    this.ventasValidas().reduce((s, p) => s + (p.descuentoAplicado ?? 0), 0)
  );
  cancelados = computed(() => this.pedidosFiltrados().filter(p => p.estado === 'CANCELADO').length);
  tasaCancelacion = computed(() => {
    const total = this.pedidosFiltrados().length;
    return total ? (this.cancelados() / total) * 100 : 0;
  });

  /* ── Gráfico de área: ventas por día ── */
  ventasPorDia = computed(() => {
    const grupos = new Map<string, { total: number; count: number }>();
    for (const p of this.ventasValidas()) {
      const f = this.dateOnly(p.createdAt);
      if (!f) continue;
      const g = grupos.get(f) ?? { total: 0, count: 0 };
      g.total += p.total ?? 0;
      g.count += 1;
      grupos.set(f, g);
    }
    const days = [...grupos.entries()]
      .map(([fecha, v]) => ({ fecha, total: v.total, count: v.count }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const W = 1000, H = 280, padL = 48, padR = 20, padTop = 24, padBot = 48;
    const plotW = W - padL - padR;
    const plotH = H - padTop - padBot;
    const baseY = padTop + plotH;
    const maxTotal = Math.max(1, ...days.map(d => d.total));
    const n = days.length;
    const step = n > 1 ? Math.ceil(n / 8) : 1;

    const points: LinePoint[] = days.map((d, i) => {
      const x = n === 1 ? padL + plotW / 2 : padL + (i * plotW) / (n - 1);
      const y = padTop + (1 - d.total / maxTotal) * plotH;
      return {
        x, y, fecha: d.fecha, total: d.total,
        label: this.fechaCorta(d.fecha),
        show: i % step === 0 || i === n - 1,
      };
    });

    let linePath = '', areaPath = '';
    if (points.length) {
      linePath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      areaPath = `M ${points[0].x.toFixed(1)} ${baseY} `
        + points.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
        + ` L ${points[points.length - 1].x.toFixed(1)} ${baseY} Z`;
    }

    const gridLines = [0, .25, .5, .75, 1].map(f => ({
      y: padTop + (1 - f) * plotH,
      value: maxTotal * f,
    }));

    return { days, points, linePath, areaPath, maxTotal, baseY, W, H, padL, gridLines };
  });

  /* ── Donut: pedidos por estado ── */
  pedidosPorEstado = computed(() => {
    const grupos = new Map<string, number>();
    for (const p of this.pedidosFiltrados()) {
      grupos.set(p.estado, (grupos.get(p.estado) ?? 0) + 1);
    }
    const orden = ['PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];
    const entries = [...grupos.entries()].sort((a, b) => orden.indexOf(a[0]) - orden.indexOf(b[0]));
    return this.buildDonut(entries.map(([k, v]) => ({
      label: this.estadoLabel(k), value: v, color: this.estadoColor(k),
    })));
  });

  /* ── Donut: métodos de pago ── */
  metodosPago = computed(() => {
    const grupos = new Map<string, number>();
    for (const p of this.ventasValidas()) {
      const m = p.metodoPago ?? 'OTRO';
      grupos.set(m, (grupos.get(m) ?? 0) + 1);
    }
    return this.buildDonut([...grupos.entries()].map(([k, v]) => ({
      label: this.metodoLabel(k), value: v, color: this.metodoColor(k),
    })));
  });

  /* ── Barras: ventas por hora (horario pico) ── */
  ventasPorHora = computed(() => {
    const grupos = new Map<number, { count: number; total: number }>();
    for (const p of this.ventasValidas()) {
      const h = this.hourOf(p.createdAt);
      if (h < 0) continue;
      const g = grupos.get(h) ?? { count: 0, total: 0 };
      g.count += 1;
      g.total += p.total ?? 0;
      grupos.set(h, g);
    }
    const horas = [...grupos.entries()]
      .map(([hora, v]) => ({ hora, count: v.count, total: v.total }))
      .sort((a, b) => a.hora - b.hora);
    const maxCount = Math.max(1, ...horas.map(h => h.count));
    return horas.map(h => ({
      ...h,
      heightPct: Math.round((h.count / maxCount) * 100),
      etiqueta: `${h.hora.toString().padStart(2, '0')}:00`,
    }));
  });

  ngOnInit() { this.consultar(); }

  consultar() {
    this.consultarVentas();
    this.consultarPedidos();
  }

  consultarVentas() {
    this.loadingVentas.set(true);
    this.errorVentas.set('');
    this.reportesSvc.getVentas(this.fechaInicio(), this.fechaFin()).subscribe({
      next:  v  => { this.ventas.set(v); this.loadingVentas.set(false); },
      error: () => { this.errorVentas.set('No se pudo cargar el reporte de ventas.'); this.loadingVentas.set(false); }
    });
  }

  consultarPedidos() {
    this.loadingPedidos.set(true);
    this.errorPedidos.set('');
    this.pedidoSvc.getAll().subscribe({
      next:  p  => { this.pedidos.set(p); this.loadingPedidos.set(false); },
      error: () => { this.errorPedidos.set('No se pudieron cargar los datos analíticos.'); this.loadingPedidos.set(false); }
    });
  }

  descargarVentas() {
    this.descargando.set('ventas');
    this.reportesSvc.descargarVentasExcel(this.fechaInicio(), this.fechaFin()).subscribe({
      next: blob => { this.triggerDescarga(blob, `ventas_${this.fechaInicio()}_${this.fechaFin()}.xlsx`); this.descargando.set(null); },
      error: () => this.descargando.set(null)
    });
  }

  descargarInventario() {
    this.descargando.set('inventario');
    this.reportesSvc.descargarInventarioExcel().subscribe({
      next: blob => { this.triggerDescarga(blob, `inventario_${this.hoy()}.xlsx`); this.descargando.set(null); },
      error: () => this.descargando.set(null)
    });
  }

  /* ── Helpers de donut ── */
  private buildDonut(items: { label: string; value: number; color: string }[]): { total: number; segments: DonutSegment[] } {
    const total = items.reduce((s, i) => s + i.value, 0);
    let acc = 0;
    const segments: DonutSegment[] = items.map(i => {
      const percent = total ? (i.value / total) * 100 : 0;
      const len = total ? (i.value / total) * this.DONUT_C : 0;
      const seg: DonutSegment = {
        label: i.label, value: i.value, percent, color: i.color,
        dash: `${len.toFixed(2)} ${(this.DONUT_C - len).toFixed(2)}`,
        offset: -acc,
      };
      acc += len;
      return seg;
    });
    return { total, segments };
  }

  /* ── Helpers de fechas ── */
  private dateOnly(iso?: string): string { return iso ? iso.split('T')[0] : ''; }
  private hourOf(iso?: string): number {
    if (!iso) return -1;
    const t = iso.split('T')[1];
    return t ? parseInt(t.slice(0, 2), 10) : -1;
  }
  private fechaCorta(fecha: string): string {
    const p = fecha.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : fecha;
  }

  /* ── Etiquetas y colores ── */
  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      PENDIENTE: 'Pendiente', PAGADO: 'Pagado', EN_PREPARACION: 'En preparación',
      LISTO: 'Listo', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
    };
    return m[e] ?? e;
  }
  estadoColor(e: string): string {
    const m: Record<string, string> = {
      PENDIENTE: '#A8A29E', PAGADO: '#FBBF24', EN_PREPARACION: '#60A5FA',
      LISTO: '#34D399', ENTREGADO: '#10B981', CANCELADO: '#F87171',
    };
    return m[e] ?? '#D6D3D1';
  }
  metodoLabel(m: string): string {
    const map: Record<string, string> = { YAPE: 'Yape', PLIN: 'Plin', EFECTIVO: 'Efectivo' };
    return map[m] ?? m;
  }
  metodoColor(m: string): string {
    const map: Record<string, string> = { YAPE: '#7C3AED', PLIN: '#06B6D4', EFECTIVO: '#16A34A' };
    return map[m] ?? '#A8A29E';
  }

  private triggerDescarga(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  }

  private hoy(): string { return new Date().toISOString().split('T')[0]; }
  private primerDiaMes(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }
}
