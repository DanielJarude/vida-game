import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
import { iniciarTema } from './ui/tema';
// As fontes vêm do próprio jogo (PWA offline: nada do jogo depende da rede).
import './ui/fontes.css';
import './ui/vida.css';
import './ui/vivida.css';
import './ui/agir.css';
import './ui/mundo-vivo.css';
// REWORK 6.5: o sistema visual global (aparência, ritmo e componentes compartilhados entre as áreas).
import './ui/sistema.css';
// REWORK 7: as peças da experiência (práticas, degraus, percursos, abas locais, vitrines, fichas).
import './ui/experiencia.css';
import './ui/cotidiano.css';
import './ui/organizada.css';
// REWORK 9.5: a vida em objetos (a agenda, o boletim, a pasta, o álbum, o diário, a ficha, os papéis da casa).
import './ui/objetos.css';
// REWORK 9.6: os registros da pessoa (o anúncio de emprego, a ficha de atributos, o boletim em papel, o currículo).
import './ui/registros.css';

iniciarTema();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
