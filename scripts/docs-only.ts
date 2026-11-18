/**
 * `node scripts/docs-only.ts [--each] <base> <head>` (ADR-033): sale con 0 si de `base` a `head` solo cambian docs, y
 * con 1 en cualquier otro caso (también si algo falla). Es el contrato del `ignoreCommand` de Vercel (0 = no
 * desplegar), y el CI lo lee igual: los dos miran el árbol final. Con `--each` (el pre-push) mira también cada commit.
 * El criterio está en `docsOnly.ts`.
 */
import { checkDocsOnly, checkEachCommitDocsOnly } from './docsOnly.ts';

const args = process.argv.slice(2);
const each = args[0] === '--each';
const [base = '', head = ''] = each ? args.slice(1) : args;
const verdict = each ? checkEachCommitDocsOnly(base, head) : checkDocsOnly(base, head);
// A stderr: el CI usa la salida del código, no la del texto.
console.error(verdict.message);
process.exitCode = verdict.docsOnly ? 0 : 1;
