import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ReporteVentas {
  fechaInicio:       string;
  fechaFin:          string;
  totalVentas:       number;
  totalPedidos:      number;
  promedioPorPedido: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/reports`;

  getVentas(fechaInicio?: string, fechaFin?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin)    params['fechaFin']    = fechaFin;
    return this.http.get<ReporteVentas>(`${this.url}/sales`, { params });
  }

  descargarVentasExcel(fechaInicio?: string, fechaFin?: string) {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin)    params['fechaFin']    = fechaFin;
    return this.http.get(`${this.url}/sales/excel`, { params, responseType: 'blob' });
  }

  descargarInventarioExcel() {
    return this.http.get(`${this.url}/inventory/excel`, { responseType: 'blob' });
  }
}
