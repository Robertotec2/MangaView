import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { capituloService } from '../services/api';

interface Capitulo {
  id: number;
  titulo: string;
  numero: number;
  paginas: string[];
}

const Lector: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [capitulo, setCapitulo] = useState<Capitulo | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);

  useEffect(() => {
    if (!id) return;
    capituloService.getById(Number(id))
      .then(res => setCapitulo(res.data))
      .catch(console.error);
  }, [id]);

  const avanzar = async () => {
    if (!capitulo || paginaActual >= capitulo.paginas.length - 1) return;
    const siguiente = paginaActual + 1;
    setPaginaActual(siguiente);
    await capituloService.guardarProgreso(capitulo.id, siguiente + 1);
  };

  const retroceder = () => {
    if (paginaActual > 0) setPaginaActual(paginaActual - 1);
  };

  if (!capitulo) return <p>Cargando capítulo...</p>;

  return (
    <div className="lector">
      <h2>{capitulo.titulo} — Página {paginaActual + 1} / {capitulo.paginas.length}</h2>
      <img src={capitulo.paginas[paginaActual]} alt={`Página ${paginaActual + 1}`} />
      <div className="controles">
        <button onClick={retroceder} disabled={paginaActual === 0}>Anterior</button>
        <button onClick={avanzar} disabled={paginaActual === capitulo.paginas.length - 1}>Siguiente</button>
      </div>
    </div>
  );
};

export default Lector;
