/**
 * `node scripts/docs-only.ts <base> <head>` (ADR-033): sale con 0 si de `base` a `head` solo cambian docs, y con 1 en
 * cualquier otro caso (también si algo falla). Es el contrato del `ignoreCommand` de Vercel (0 = no desplegar); el
 * pre-push y el CI lo leen igual. El criterio está en `docsOnly.ts`.
 */
import { checkDocsOnly } from './docsOnly.ts';

const [base = '', head = ''] = process.argv.slice(2);
const verdict = checkDocsOnly(base, head);
// A stderr: el CI usa la salida del código, no la del texto.
console.error(verdict.message);
process.exitCode = verdict.docsOnly ? 0 : 1;
