import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Board from './pages/Board';

// Componentes rápidos para el ejemplo
const Home = () => <h1>Bienvenido al Home 🏠</h1>;
const Productos = () => <h1>Esta es la página de Productos 📦</h1>;

export default function App() {
  return (
  <div className='background'>
    <BrowserRouter>
      {/* Tu barra de navegación / menú */}
      <nav style={{ padding: '15px', background: '#eee', display: 'flex', gap: '15px' }}>
        {/* USAMOS <Link> EN LUGAR DE <a> PARA QUE LA PÁGINA NO SE RECARGUE DESDE CERO */}
        <Link to="/">Board</Link>
        <Link to="/productos">Productos</Link>
      </nav>

      {/* Aquí es donde React Router decide qué componente pintar según la URL */}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/productos" element={<Productos />} />
        </Routes>
      </div>
    </BrowserRouter>
    </div>
  );
}