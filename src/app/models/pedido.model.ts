export interface ItemPedidoRequest {
  productoId: string;
  cantidad: number;
  nota?: string;
}

export interface PedidoRequest {
  metodoPago: 'YAPE' | 'PLIN';
  items: ItemPedidoRequest[];
  observaciones?: string;
  horaProgramada?: string;
}

export interface ItemPedidoResponse {
  id?: string;
  productoId?: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
  nota?: string;
}

export interface PedidoResponse {
  id: string;
  numeroPedido?: string;
  estado: string;
  metodoPago?: 'YAPE' | 'PLIN' | 'EFECTIVO';
  voucherUrl?: string;
  total: number;
  subtotal?: number;
  descuentoAplicado?: number;
  items?: ItemPedidoResponse[];
  observaciones?: string;
  motivoCancelacion?: string;
  horaProgramada?: string;
  createdAt?: string;
  usuarioNombre?: string;
  usuarioEmail?: string;
}
