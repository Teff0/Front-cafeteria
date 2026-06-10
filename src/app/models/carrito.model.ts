import { ProductoResponse } from './producto.model';
export interface CarritoItem { producto: ProductoResponse; cantidad: number; nota?: string; }
