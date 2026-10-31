import { fichaPublica } from './_lib/ficha.js';

// URL antigua /producto?id=…: redirige a la ficha con URL limpia
export const onRequestGet = fichaPublica();
