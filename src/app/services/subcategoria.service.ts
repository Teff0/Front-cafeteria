import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SubcategoriaResponse, SubcategoriaRequest } from '../models/subcategoria.model';

@Injectable({ providedIn: 'root' })
export class SubcategoriaService {
  private url = `${environment.apiUrl}/subcategories`;
  constructor(private http: HttpClient) {}

  getAll()                     { return this.http.get<SubcategoriaResponse[]>(this.url); }
  getPorCategoria(catId: string) {
    return this.http.get<SubcategoriaResponse[]>(`${this.url}/by-category/${catId}`);
  }
  crear(r: SubcategoriaRequest)              { return this.http.post<SubcategoriaResponse>(this.url, r); }
  update(id: string, r: SubcategoriaRequest) { return this.http.put<SubcategoriaResponse>(`${this.url}/${id}`, r); }
  delete(id: string)                         { return this.http.delete<void>(`${this.url}/${id}`); }
}
