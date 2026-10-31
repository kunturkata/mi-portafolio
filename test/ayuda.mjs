import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const raiz = new URL('../', import.meta.url);

export const ejemplo = nombre => JSON.parse(readFileSync(new URL(`config/${nombre}.example.json`, raiz), 'utf8'));
export const copia = objeto => structuredClone(objeto);

// Carga public/assets/app.js con un window/document mínimos y devuelve window.app
export function cargarApp() {
  globalThis.window = {};
  globalThis.document = { addEventListener() {}, querySelectorAll: () => [] };
  new Function(readFileSync(fileURLToPath(new URL('public/assets/app.js', raiz)), 'utf8'))();
  return globalThis.window.app;
}
