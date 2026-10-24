import { shinigami } from './shinigami';
import { komiku } from './komiku';

export { shinigami, komiku };

export const SOURCES = {
  shinigami,
  komiku,
};

export function sourceFor(key) {
  return SOURCES[key] || shinigami;
}
