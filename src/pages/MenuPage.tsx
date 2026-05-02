import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menus, pedidos } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Menu as MenuType, PedidoRequest } from '../types';

export function MenuPage() {
  const [menu, setMenu] = useState<MenuType | null>(null);
  const [carrito, setCarrito] = useState<{ productoId: string; cantidad: number }[]>([]);
  const [horaProgramada, setHoraProgramada] = useState('12:00');
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cargarMenu();
  }, []);

  const cargarMenu = async () => {
    try {
      const data = await menus.getHoy();
      setMenu(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const agregarCarrito = (productoId: string) => {
    const existente = carrito.find((item) => item.productoId === productoId);
    if (existente) {
      setCarrito(carrito.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, { productoId, cantidad: 1 }]);
    }
};

  const calcularTotal = () => {
    if (!menu) return 0;
    return carrito.reduce((total, item) => {
      const producto = menu.productos.find((p) => p.id === item.productoId);
      return total + (producto?.precio || 0) * item.cantidad;
    }, 0);
  };

  const crearPedido = async () => {
    if (carrito.length === 0) return;
    setCreando(true);
    try {
      const pedido: PedidoRequest = {
        horaProgramada,
        items: carrito,
      };
      await pedidos.create(pedido);
      navigate('/mis-pedidos');
    } catch (err) {
      console.error(err);
    } finally {
      setCreando(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Cafetería UTP</h1>
          <div className="flex gap-4">
            <button onClick={() => navigate('/mis-pedidos')} className="hover:underline">
              Mis Pedidos
            </button>
            <button onClick={logout} className="hover:underline">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Menú del Día - {menu?.horario}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {menu?.productos.map((producto) => (
            <div key={producto.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-lg">{producto.nombre}</h3>
              <p className="text-gray-600 text-sm">{producto.descripcion}</p>
              <p className="text-blue-600 font-bold mt-2">S/ {producto.precio.toFixed(2)}</p>
              <button
                onClick={() => agregarCarrito(producto.id)}
                disabled={!producto.disponible}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          ))}
        </div>

        {carrito.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div>
                <p className="font-bold">Total: S/ {calcularTotal().toFixed(2)}</p>
                <p className="text-sm text-gray-600">{carrito.length} productos</p>
              </div>
              <div className="flex gap-4">
                <input
                  type="time"
                  value={horaProgramada}
                  onChange={(e) => setHoraProgramada(e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <button
                  onClick={crearPedido}
                  disabled={creando}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {creando ? 'Creando...' : 'Hacer Pedido'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}