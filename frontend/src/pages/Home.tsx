import React, { useEffect, useState } from 'react';
import { mangaService } from '../services/api';

interface Manga {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  portada_url: string;
  estado: string;
}

const Home: React.FC = () => {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    mangaService.getCatalogo()
      .then(res => setMangas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando catálogo...</p>;

  return (
    <div className="catalogo">
      <h1>Catálogo</h1>
      <div className="grid">
        {mangas.map(m => (
          <div key={m.id} className="manga-card">
            <img src={m.portada_url} alt={m.titulo} />
            <h3>{m.titulo}</h3>
            <p>{m.autor}</p>
            <span>{m.genero}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
