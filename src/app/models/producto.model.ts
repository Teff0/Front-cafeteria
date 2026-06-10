export interface ProductoResponse {
  id: string; nombre: string; descripcion: string; precio: number;
  imagenUrl: string; disponible: boolean; stock: number;
  categoriaId: string; categoriaNombre: string;
  subcategoriaId?: string; subcategoriaNombre?: string;
}
export interface ProductoRequest {
  nombre: string; descripcion?: string; precio: number;
  imagenUrl?: string; disponible?: boolean; stock?: number;
  categoriaId: string; subcategoriaId?: string;
}
