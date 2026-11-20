#!/usr/bin/env node
/* Static checks with no dependency beyond acorn, which esbuild's tree already
   installs. Three laws:

     1. no undefined name          a moved block cannot leave a dangling reference
     2. no unused binding          an import or local nobody reads is deleted
     3. world stages are wired     a stage in src/world/ reads from `w` exactly the
                                   names its body uses, and only names an earlier
                                   stage returns (src/worldgen.js owns the order)

   node tools/lint.mjs            check src/ and lab/
   node tools/lint.mjs --fix      also rewrite each stage's `const {…}=w;` list */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const acorn = createRequire(join(ROOT, 'package.json'))('acorn');
const parse = (code) => acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

const GLOBALS = new Set(`undefined NaN Infinity Math Object Array Number String Boolean JSON Map Set
  WeakMap WeakSet Symbol Promise Error TypeError RangeError Date RegExp parseInt parseFloat isNaN
  isFinite console globalThis window document navigator location history performance
  requestAnimationFrame cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval
  Float32Array Float64Array Uint8Array Uint8ClampedArray Uint16Array Uint32Array Int8Array Int16Array
  Int32Array ArrayBuffer DataView URL URLSearchParams Blob Worker self postMessage addEventListener
  removeEventListener matchMedia innerWidth innerHeight devicePixelRatio fetch Audio AudioContext
  Image ImageData HTMLElement Event CustomEvent structuredClone queueMicrotask TextEncoder
  TextDecoder process Buffer arguments BigInt Intl Reflect Proxy atob btoa getComputedStyle
  localStorage sessionStorage crypto AbortController ResizeObserver MutationObserver FontFace
  OffscreenCanvas createImageBitmap screen visualViewport encodeURIComponent
  decodeURIComponent`.split(/\s+/));

/* Scope walk. Returns names read but never declared (`free`), declarations never
   read (`unused`), and the names declared at the top level (`declared`). */
function scan(ast) {
  const free = new Map(), scopes = [];
  const open = (parent, fn) => { const s = { parent, fn, vars: new Map() }; scopes.push(s); return s; };
  const declare = (s, name, node, kind) => { if (!s.vars.has(name)) s.vars.set(name, { node, kind, used: 0 }); };
  const fnScope = (s) => { while (!s.fn) s = s.parent; return s; };
  const bind = (p, s, kind, onExpr) => {
    if (!p) return;
    if (p.type === 'Identifier') declare(s, p.name, p, kind);
    else if (p.type === 'ObjectPattern') for (const q of p.properties) {
      if (q.type === 'RestElement') bind(q.argument, s, kind, onExpr);
      else { if (q.computed) onExpr(q.key); bind(q.value, s, kind, onExpr); }
    } else if (p.type === 'ArrayPattern') for (const q of p.elements) bind(q, s, kind, onExpr);
    else if (p.type === 'RestElement') bind(p.argument, s, kind, onExpr);
    else if (p.type === 'AssignmentPattern') { bind(p.left, s, kind, onExpr); onExpr(p.right); }
  };
  const read = (s, name, node) => {
    for (let q = s; q; q = q.parent) if (q.vars.has(name)) { q.vars.get(name).used++; return; }
    if (!GLOBALS.has(name) && !free.has(name)) free.set(name, node.loc.start.line);
  };
  const hoist = (body, s) => {
    for (const n of body) {
      if (!n) continue;
      if (n.type === 'FunctionDeclaration') declare(s, n.id.name, n.id, 'function');
      else if (n.type === 'ClassDeclaration') declare(s, n.id.name, n.id, 'class');
      else if (n.type === 'VariableDeclaration') for (const d of n.declarations) bind(d.id, n.kind === 'var' ? fnScope(s) : s, n.kind, () => {});
      else if (n.type === 'ImportDeclaration') for (const sp of n.specifiers) declare(s, sp.local.name, sp.local, 'import');
      else if (n.type === 'ExportNamedDeclaration' && n.declaration) hoist([n.declaration], s);
      else if (n.type === 'ExportDefaultDeclaration' && n.declaration.id) hoist([n.declaration], s);
    }
  };
  const visit = (n, s) => {
    if (!n || typeof n.type !== 'string') return;
    switch (n.type) {
      case 'Program': hoist(n.body, s); n.body.forEach((c) => visit(c, s)); return;
      case 'BlockStatement': case 'StaticBlock': { const b = open(s, false); hoist(n.body, b); n.body.forEach((c) => visit(c, b)); return; }
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': {
        const f = open(s, true);
        if (n.type === 'FunctionExpression' && n.id) declare(f, n.id.name, n.id, 'fnname');
        for (const p of n.params) bind(p, f, 'param', (d) => visit(d, f));
        if (n.body.type === 'BlockStatement') { hoist(n.body.body, f); n.body.body.forEach((c) => visit(c, f)); } else visit(n.body, f);
        return;
      }
      case 'ClassDeclaration': case 'ClassExpression':
        visit(n.superClass, s);
        for (const m of n.body.body) { if (m.computed) visit(m.key, s); if (m.type === 'StaticBlock') visit(m, s); else visit(m.value, s); }
        return;
      /* names were declared by hoist; this pass only visits defaults and initialisers */
      case 'VariableDeclaration': for (const d of n.declarations) { bind(d.id, { parent: null, fn: true, vars: new Map() }, 'skip', (e) => visit(e, s)); visit(d.init, s); } return;
      case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
        const b = open(s, false), head = n.init || n.left;
        if (head && head.type === 'VariableDeclaration') hoist([head], b);
        for (const k of ['init', 'left', 'test', 'update', 'right', 'body']) visit(n[k], b);
        return;
      }
      case 'CatchClause': { const b = open(s, false); bind(n.param, b, 'param', () => {}); visit(n.body, b); return; }
      case 'Identifier': read(s, n.name, n); return;
      case 'MemberExpression': visit(n.object, s); if (n.computed) visit(n.property, s); return;
      case 'Property': case 'PropertyDefinition': case 'MethodDefinition': if (n.computed) visit(n.key, s); visit(n.value, s); return;
      case 'LabeledStatement': visit(n.body, s); return;
      case 'BreakStatement': case 'ContinueStatement': case 'ImportDeclaration': case 'ExportAllDeclaration': case 'MetaProperty': return;
      case 'ExportNamedDeclaration':
        if (n.declaration) visit(n.declaration, s);
        else if (!n.source) for (const sp of n.specifiers) read(s, sp.local.name, sp.local);
        return;
      default:
        for (const k of Object.keys(n)) {
          if (k === 'type' || k === 'loc' || k === 'start' || k === 'end') continue;
          const v = n[k];
          if (Array.isArray(v)) v.forEach((c) => visit(c, s)); else if (v && typeof v.type === 'string') visit(v, s);
        }
    }
  };
  const top = open(null, true);
  visit(ast, top);
  const exported = new Set();
  for (const n of ast.body) if (n.type === 'ExportNamedDeclaration' && n.declaration) {
    const d = n.declaration;
    if (d.id) exported.add(d.id.name); else for (const q of d.declarations || []) exported.add(q.id.name);
  }
  const unused = [];
  for (const s of scopes) for (const [name, v] of s.vars)
    if (!v.used && v.kind !== 'param' && v.kind !== 'fnname' && !name.startsWith('_') && !(s === top && exported.has(name)))
      unused.push(`${name}@${v.node.loc.start.line}`);
  return { free, unused, declared: [...top.vars.keys()] };
}

const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

function lintFiles(files) {
  const findings = [];
  for (const file of files) {
    const { free, unused } = scan(parse(readFileSync(join(ROOT, file), 'utf8')));
    for (const [name, line] of free) findings.push(`${file}:${line} undefined name ${name}`);
    for (const u of unused) { const [name, line] = u.split('@'); findings.push(`${file}:${line} unused binding ${name}`); }
  }
  return findings;
}

/* The world stage pipeline. Each src/world/*.js exports `make<Stage>(w)`, opens
   with `const {…}=w;` and ends with `return {…};`. */
function lintStages({ fix = false } = {}) {
  const findings = [];
  const composer = readFileSync(join(ROOT, 'src/worldgen.js'), 'utf8');
  const fileOf = new Map([...composer.matchAll(/import \{([^}]*)\} from '\.\/world\/([\w-]+)\.js'/g)]
    .flatMap((m) => m[1].split(',').map((n) => [n.trim(), m[2]])));
  const order = [...composer.match(/const STAGES=\[([\s\S]*?)\];/)[1].matchAll(/make\w+/g)].map((m) => m[0]);
  const wrap = (names) => {
    const lines = []; let line = '    ';
    for (const n of names) { if ((line + n + ',').length > 78) { lines.push(line.trimEnd()); line = '    '; } line += `${n}, `; }
    lines.push(line.trimEnd());
    return lines.join('\n');
  };
  const provided = new Set(['seed', 'opt']), stages = [];
  for (const fn of order) {
    const file = `src/world/${fileOf.get(fn)}.js`, path = join(ROOT, file);
    const text = readFileSync(path, 'utf8');
    const head = text.match(/function make\w+\(w\)\{\n  const \{\n([\s\S]*?)\n  \}=w;\n/);
    if (!head) { findings.push(`${file}: stage does not open with \`const {…}=w;\``); continue; }
    const bodyStart = head.index + head[0].length, retAt = text.lastIndexOf('\n  return {'), bodyEnd = text.indexOf('\n}\n', retAt);
    const moduleNames = new Set(scan(parse(text)).declared);
    const body = scan(parse(`function __stage(){\n${text.slice(bodyStart, bodyEnd)}\n}`));
    const needs = [...body.free.keys()].filter((n) => !moduleNames.has(n) && n !== 'w').sort();
    const listed = head[1].split(/[\s,]+/).filter(Boolean).sort();
    for (const n of needs) if (!provided.has(n)) findings.push(`${file}: reads ${n} from w, but no earlier stage returns it`);
    if (needs.join() !== listed.join()) {
      if (fix) writeFileSync(path, text.slice(0, head.index) + head[0].replace(head[1], wrap(needs)) + text.slice(bodyStart));
      else findings.push(`${file}: \`const {…}=w;\` lists [${listed.filter((n) => !needs.includes(n))}] unused and misses [${needs.filter((n) => !listed.includes(n))}]. Run node tools/lint.mjs --fix`);
    }
    const ret = parse(`(${text.slice(retAt + '\n  return '.length, bodyEnd).replace(/;\s*$/, '')})`).body[0].expression;
    const returns = ret.properties.map((p) => p.key.name);
    returns.forEach((n) => provided.add(n));
    stages.push({ file, needs, returns });
  }
  const composerReads = new Set([...composer.matchAll(/\bw\.([\w$]+)/g)].map((m) => m[1]));
  stages.forEach((st, i) => {
    const later = new Set(stages.slice(i + 1).flatMap((x) => x.needs));
    for (const n of st.returns) if (!later.has(n) && !composerReads.has(n)) findings.push(`${st.file}: returns ${n}, which nothing reads`);
  });
  return findings;
}

export { lintFiles, lintStages };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = ['src', 'lab'].flatMap(walk).filter((f) => /\.m?js$/.test(f));
  const findings = [...lintStages({ fix: process.argv.includes('--fix') }), ...lintFiles(files)];
  console.log(findings.length ? findings.join('\n') : `lint: ${files.length} files clean`);
  process.exitCode = findings.length ? 1 : 0;
}
