import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
// As fontes vêm do próprio jogo (PWA offline: nada do jogo depende da rede).
import './ui/fontes.css';
import './ui/vida.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
