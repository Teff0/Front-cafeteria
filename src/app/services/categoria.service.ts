import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CategoriaResponse, CategoriaRequest } from '../models/categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private url = `${environment.apiUrl}/categories`;
  constructor(private http: HttpClient) {}
  getAll()   { return this.http.get<CategoriaResponse[]>(this.url); }
  create(r:CategoriaRequest)           { return this.http.post<CategoriaResponse>(this.url, r); }
  update(id:string, r:CategoriaRequest){ return this.http.put<CategoriaResponse>(`${this.url}/${id}`, r); }
  delete(id:string)                    { return this.http.delete<void>(`${this.url}/${id}`); }
}
