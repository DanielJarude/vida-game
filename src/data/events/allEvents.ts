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
  ...EXTRA_EVENTS
];

export function getEventCount(): number {
  return MASTER_EVENTS_LIST.length;
}
