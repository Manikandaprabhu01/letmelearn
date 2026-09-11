import { readFileSync, writeFileSync } from 'node:fs';

const payload = (await import('./.build/data-entry.js')).payload;

// Escape < so the JSON can sit inside a <script> block safely.
const json = JSON.stringify(payload).replace(/</g, '\\u003c');

const head = readFileSync(new URL('./head.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

const out = head.replace('__CONTENT_JSON__', json) + '\n<script>\n' + app + '\n</script>\n';
writeFileSync(new URL('./lattice.html', import.meta.url), out);
console.log('built', (out.length / 1024 / 1024).toFixed(2), 'MB');
