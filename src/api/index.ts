import axios from 'axios';
import type { 
  AuthResponse, 
  LoginRequest, 
  RegistroRequest, 
  Producto, 
  Menu, 
  Pedido, 
  PedidoRequest,
  Pago 
} from '../types';

const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  registro: (data: RegistroRequest) => 
    api.post<AuthResponse>('/auth/registro', data).then(res => res.data),
  login: (data: LoginRequest) => 
    api.post<AuthResponse>('/auth/login', data).then(res => res.data),
};

export const menus = {
  getHoy: () => api.get<Menu>('/menus/hoy').then(res => res.data),
  getAll: () => api.get<Menu[]>('/menus').then(res => res.data),
  getById: (id: string) => api.get<Menu>(`/menus/${id}`).then(res => res.data),
};

export const productos = {
  getAll: () => api.get<Producto[]>('/productos').then(res => res.data),
};

export const pedidos = {
  create: (data: PedidoRequest) => 
    api.post<Pedido>('/pedidos', data).then(res => res.data),
  getMisPedidos: () => 
    api.get<Pedido[]>('/pedidos/mis-pedidos').then(res => res.data),
  getById: (id: string) => 
    api.get<Pedido>(`/pedidos/${id}`).then(res => res.data),
};

export const pagos = {
  procesar: (data: { pedidoId: string; monto: number; metodoPago: string }) =>
    api.post<Pago>('/pagos/procesar', data).then(res => res.data),
  getByPedido: (pedidoId: string) =>
    api.get<Pago>(`/pagos/pedido/${pedidoId}`).then(res => res.data),
};

export const admin = {
  getAllPedidos: () => api.get<Pedido[]>('/admin/pedidos').then(res => res.data),
  getPedidosEnCola: () => api.get<Pedido[]>('/admin/pedidos/encola').then(res => res.data),
  cambiarEstado: (pedidoId: string, nuevoEstado: string, adminId: string) =>
    api.patch<Pedido>(`/admin/pedidos/${pedidoId}/estado`, 
      { pedidoId, nuevoEstado }, { params: { adminId } }).then(res => res.data),
  getAllProductos: () => api.get<Producto[]>('/admin/productos').then(res => res.data),
  createProducto: (data: Partial<Producto>) =>
    api.post<Producto>('/admin/productos', data).then(res => res.data),
  updateProducto: (id: string, data: Partial<Producto>) =>
    api.put<Producto>(`/admin/productos/${id}`, data).then(res => res.data),
  deleteProducto: (id: string) => api.delete(`/admin/productos/${id}`).then(res => res.data),
};