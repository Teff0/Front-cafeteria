export interface SubcategoriaResponse {
  id: string;
  categoriaId: string;
  categoriaNombre: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
}
export interface SubcategoriaRequest {
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
}
