import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Board from './pages/Board';
import Control from './pages/Control';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:roomId" element={<Board />} />
        <Route path="/control/:roomId" element={<Control />} />
      </Routes>
    </BrowserRouter>
  );
}