import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PedidoRequest, PedidoResponse } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private url = `${environment.apiUrl}/orders`;
  constructor(private http: HttpClient) {}

  crear(r: PedidoRequest) {
    return this.http.post<PedidoResponse>(this.url, r);
  }

  getMisPedidos() {
    return this.http.get<PedidoResponse[]>(this.url);
  }

  getAll() {
    return this.http.get<PedidoResponse[]>(this.url);
  }

  getPendientes() {
    return this.http.get<PedidoResponse[]>(this.url);
  }

  cambiarEstado(id: string, estado: string) {
    return this.http.patch<PedidoResponse>(`${this.url}/${id}/status`, { nuevoEstado: estado });
  }

  subirVoucher(id: string, voucherUrl: string) {
    return this.http.patch<PedidoResponse>(`${this.url}/${id}/voucher`, { voucherUrl });
  }

  cancelar(id: string) {
    return this.http.patch<PedidoResponse>(`${this.url}/${id}/cancel`, {});
  }
}
