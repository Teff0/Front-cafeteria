export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ESTUDIANTE' | 'ADMINISTRATIVO';
  activo: boolean;
}

export interface AuthResponse {
  token: string;
  type: string;
  email: string;
  rol: string;
  nombre: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  email: string;
  password: string;
  nombre: string;
  rol: 'ESTUDIANTE' | 'ADMINISTRATIVO';
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'BEBIDA' | 'SANDWICH' | 'POSTRE' | 'ACOMPAÑAMIENTO' | 'OTRO';
  disponible: boolean;
  imagenUrl?: string;
  stock: number;
}

export interface Menu {
  id: string;
  fecha: string;
  horario: 'DESAYUNO' | 'ALMUERZO' | 'CENA';
  activo: boolean;
  productos: Producto[];
}

export interface ItemPedido {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  usuarioEmail: string;
  usuarioNombre: string;
  menuId?: string;
  menuFecha?: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  horaProgramada: string;
  total: number;
  observaciones?: string;
  items: ItemPedido[];
  createdAt: string;
  updatedAt: string;
}

export interface PedidoRequest {
  menuId?: string;
  horaProgramada: string;
  observaciones?: string;
  items: { productoId: string; cantidad: number }[];
}

export interface Pago {
  id: string;
  pedidoId: string;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN';
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO';
  codigoTransaccion?: string;
  fechaPago?: string;
}