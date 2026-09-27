import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Board from './pages/Board';
import Control from './pages/Control';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:roomId" element={<Board />} />
        <Route path="/control/:roomId" element={<Control />} />
      </Routes>
    </HashRouter>
  );
}