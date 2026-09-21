import { GameEvent } from '../../types';
import { CHILDHOOD_EVENTS } from './childhoodEvents';
import { ADOLESCENCE_EVENTS } from './adolescenceEvents';
import { YOUNG_ADULT_EVENTS } from './youngAdultEvents';
import { ADULT_EVENTS } from './adultEvents';
import { SENIOR_EVENTS } from './seniorEvents';
import { CAREER_EVENTS } from './careerEvents';
import { HEALTH_EVENTS } from './healthEvents';
import { ROMANCE_EVENTS } from './romanceEvents';
import { RANDOM_EVENTS } from './randomEvents';
import { MORE_EVENTS } from './moreEvents';
import { EXTRA_EVENTS } from './extraEvents';
// B4-FIX3 item 3/18 — conteúdo novo organizado por fase de vida, em
// pastas próprias (earlyChildhood/childhood/adolescence), para não
// inflar os arquivos já existentes nem criar um único arquivo gigante
// de "mundo social". Cada arquivo tem um contexto coeso só seu.
import { BABY_EVENTS } from './earlyChildhood/babyEvents';
import { TODDLER_WORLD_EVENTS } from './earlyChildhood/toddlerWorldEvents';
import { SCHOOL_WORLD_EVENTS } from './childhood/schoolWorldEvents';
import { ADOLESCENCE_SOCIAL_EVENTS } from './adolescence/socialWorldEvents';
// B4-FIX4 (etapa de conteúdo) — a medição de 40 vidas de 0 a 80 mostrou a
// vida adulta perguntando quase três vezes mais do que narrava (3,0
// decisões contra 1,1 acontecimentos por década). Estes dois módulos são
// predominantemente de ACONTECIMENTOS, para que o ritmo já existente tenha
// material para narrar em vez de cair em silêncio por falta de conteúdo.
import { ADULT_WORLD_EVENTS } from './adult/adultWorldEvents';
import { LATER_LIFE_EVENTS } from './senior/laterLifeEvents';

export const MASTER_EVENTS_LIST: GameEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...ADOLESCENCE_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...ADULT_EVENTS,
  ...SENIOR_EVENTS,
  ...CAREER_EVENTS,
  ...HEALTH_EVENTS,
  ...ROMANCE_EVENTS,
  ...RANDOM_EVENTS,
  ...MORE_EVENTS,
  ...EXTRA_EVENTS,
  ...BABY_EVENTS,
  ...TODDLER_WORLD_EVENTS,
  ...SCHOOL_WORLD_EVENTS,
  ...ADOLESCENCE_SOCIAL_EVENTS,
  ...ADULT_WORLD_EVENTS,
  ...LATER_LIFE_EVENTS
];

export function getEventCount(): number {
  return MASTER_EVENTS_LIST.length;
}
