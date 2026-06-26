import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const mangaService = {
  getCatalogo: () => api.get('/mangas'),
  getById: (id: number) => api.get(`/mangas/${id}`),
  getByGenero: (genero: string) => api.get(`/mangas/genero/${genero}`)
};

export const capituloService = {
  getByManga: (mangaId: number) => api.get(`/capitulos/manga/${mangaId}`),
  getById: (id: number) => api.get(`/capitulos/${id}`),
  guardarProgreso: (id: number, pagina: number) =>
    api.post(`/capitulos/${id}/progreso`, { pagina })
};

export const usuarioService = {
  login: (correo: string, password: string) =>
    api.post('/usuarios/login', { correo, password }),
  registro: (nombre: string, correo: string, password: string) =>
    api.post('/usuarios/registro', { nombre, correo, password }),
  getFavoritos: () => api.get('/usuarios/favoritos'),
  agregarFavorito: (mangaId: number) =>
    api.post(`/usuarios/favoritos/${mangaId}`)
};
