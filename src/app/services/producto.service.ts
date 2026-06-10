import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductoResponse, ProductoRequest } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private url = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}
  uploadImagen(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/upload`, fd);
  }

  getAll()          { return this.http.get<ProductoResponse[]>(this.url); }
  getAvailable()    { return this.http.get<ProductoResponse[]>(`${this.url}/available`); }
  getById(id:string){ return this.http.get<ProductoResponse>(`${this.url}/${id}`); }
  crear(r:ProductoRequest)            { return this.http.post<ProductoResponse>(this.url, r); }
  create(r:ProductoRequest)          { return this.crear(r); }
  update(id:string, r:ProductoRequest){ return this.http.put<ProductoResponse>(`${this.url}/${id}`, r); }
  delete(id:string)                  { return this.http.delete<void>(`${this.url}/${id}`); }
  setDisponible(id:string, disponible:boolean) {
    return this.http.patch<ProductoResponse>(`${this.url}/${id}/disponible`, { disponible });
  }
}
