// VIDA 31: a Minha Trajetória (página inicial de Caminhos) num pacote à parte — pré-carregada com o jogo (App.precarregar).
import { sobDemanda } from '../util/sobDemanda';
export const Trajetoria31 = sobDemanda(() => import('./Trajetoria31').then(m => m.default));
