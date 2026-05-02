import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Pedido } from '../types';

export function AdminPage() {
  const [pedidosEnCola, setPedidosEnCola] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.rol !== 'ADMINISTRATIVO') {
      navigate('/login');
      return;
    }
    cargarPedidos();
  }, [user]);

  const cargarPedidos = async () => {
    try {
      const data = await admin.getPedidosEnCola();
      setPedidosEnCola(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    try {
      await admin.cambiarEstado(pedidoId, nuevoEstado, user!.id);
      cargarPedidos();
    } catch (err) {
      console.error(err);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-200 text-yellow-800';
      case 'PAGADO': return 'bg-blue-200 text-blue-800';
      case 'EN_PREPARACION': return 'bg-orange-200 text-orange-800';
      case 'LISTO': return 'bg-green-200 text-green-800';
      case 'ENTREGADO': return 'bg-gray-200 text-gray-800';
      default: return 'bg-red-200 text-red-800';
    }
  };

  if (loading || user?.rol !== 'ADMINISTRATIVO') {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel - Cafetería UTP</h1>
          <div className="flex gap-4">
            <button onClick={logout} className="hover:underline">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Pedidos en Cola</h2>

        {pedidosEnCola.length === 0 ? (
          <p className="text-center text-gray-600 mt-8">No hay pedidos en cola</p>
        ) : (
          <div className="grid gap-4">
            {pedidosEnCola.map((pedido) => (
              <div key={pedido.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">Pedido #{pedido.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">{pedido.usuarioEmail}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Hora: {pedido.horaProgramada}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded ${getEstadoColor(pedido.estado)}`}>
                    {pedido.estado}
                  </span>
                </div>

                <div className="border-t mt-2 pt-2">
                  {pedido.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.productoNombre} x{item.cantidad}</span>
                      <span>S/ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>S/ {pedido.total.toFixed(2)}</span>
                </div>

                <div className="flex gap-2 mt-4">
                  {pedido.estado === 'PAGADO' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'EN_PREPARACION')}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                      Iniciar Preparación
                    </button>
                  )}
                  {pedido.estado === 'EN_PREPARACION' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'LISTO')}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Marcar Listo
                    </button>
                  )}
                  {pedido.estado === 'LISTO' && (
                    <button
                      onClick={() => cambiarEstado(pedido.id, 'ENTREGADO')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Confirmar Entrega
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}