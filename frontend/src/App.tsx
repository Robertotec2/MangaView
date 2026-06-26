import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lector from './pages/Lector';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leer/:id" element={<Lector />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
