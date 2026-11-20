#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASELINE = 127_610;
const TARGET_LOW = 70_200;
const TARGET_HIGH = 82_900;

/* What a session actually pays, and the only two numbers gated.
   `promptAlways` is charged on every call. `maxRoute` is the worst single-file
   route: always-loaded plus every rule the heaviest file matches, per loader.
   Both are constants and must stay constant as the repository grows.

   Total maintained prose is REPORTED, never gated. A word in docs/CANON.md
   costs nothing until something opens it, so capping the total penalises writing
   detail into a routed doc, which is the thing that keeps these two numbers
   flat. TARGET_HIGH stays as the health signal it always was. */
export const CEILING = { promptAlways: 2_080, maxRoute: 2_330 };
const TOKENS_PER_WORD = 1.3;
const CODE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const EXCLUDED_DIRS = new Set([
  '.git',
  'worktrees',
  'node_modules',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  'artifacts',
  'screenshots',
  'review',
]);
// A work list for the prose sprint, deleted when its last box is ticked.
// It tracks maintained prose and is not maintained prose itself.
const EXCLUDED_FILES = new Set(['docs/PROSE-SPRINT.md']);
const REGEX_PREFIX_WORDS = new Set([
  'await', 'case', 'delete', 'do', 'else', 'in', 'instanceof', 'new',
  'of', 'return', 'throw', 'typeof', 'void', 'yield',
]);

const compareNames = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const slash = (path) => path.split('\\').join('/');
const format = (number) => Math.round(number).toLocaleString('en-US');
const signed = (number) => `${number > 0 ? '+' : ''}${format(number)}`;

export function wordCount(text) {
  return text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function skipQuoted(source, start, quote) {
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    i++;
  }
  return i;
}

function skipRegex(source, start) {
  let i = start + 1;
  let inClass = false;
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) {
      i++;
      while (i < source.length && /[a-z]/i.test(source[i])) i++;
      return i;
    } else if (c === '\n' || c === '\r') {
      return i;
    }
    i++;
  }
  return i;
}

function skipTemplateExpression(source, start) {
  let i = start;
  let depth = 1;
  let regexAllowed = true;
  while (i < source.length && depth > 0) {
    const c = source[i];
    const next = source[i + 1];
    if (/\s/.test(c)) {
      i++;
    } else if (c === "'" || c === '"') {
      i = skipQuoted(source, i, c);
      regexAllowed = false;
    } else if (c === '`') {
      i = skipTemplate(source, i);
      regexAllowed = false;
    } else if (c === '/' && next === '/') {
      i = source.indexOf('\n', i + 2);
      if (i < 0) return source.length;
      regexAllowed = true;
    } else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      regexAllowed = true;
    } else if (c === '/' && regexAllowed) {
      i = skipRegex(source, i);
      regexAllowed = false;
    } else if (c === '/') {
      i += next === '=' ? 2 : 1;
      regexAllowed = true;
    } else if (/[$_\p{L}]/u.test(c)) {
      const wordStart = i++;
      while (i < source.length && /[$_\p{L}\p{N}]/u.test(source[i])) i++;
      regexAllowed = REGEX_PREFIX_WORDS.has(source.slice(wordStart, i));
    } else if (/\p{N}/u.test(c)) {
      i++;
      while (i < source.length && /[\p{N}a-fA-F_xXobOB.eE+-]/u.test(source[i])) i++;
      regexAllowed = false;
    } else if (c === '{') {
      depth++;
      regexAllowed = true;
      i++;
    } else if (c === '}') {
      depth--;
      regexAllowed = false;
      i++;
    } else {
      regexAllowed = !(c === ')' || c === ']' || c === '.'
        || (c === '+' && next === '+') || (c === '-' && next === '-'));
      if (next === c && (c === '+' || c === '-')) i++;
      i++;
    }
  }
  return i;
}

function skipTemplate(source, start) {
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === '`') return i + 1;
    if (source[i] === '$' && source[i + 1] === '{') {
      i = skipTemplateExpression(source, i + 2);
      continue;
    }
    i++;
  }
  return i;
}

/**
 * Extract JavaScript comments with a small lexer. Strings, template literals,
 * and regular-expression bodies are skipped, so comment-like text inside them
 * does not inflate prose counts.
 */
export function extractJsComments(source) {
  const comments = [];
  let i = 0;
  let regexAllowed = true;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    if (c === "'" || c === '"') {
      i = skipQuoted(source, i, c);
      regexAllowed = false;
      continue;
    }
    if (c === '`') {
      i = skipTemplate(source, i);
      regexAllowed = false;
      continue;
    }

    if (c === '/' && next === '/') {
      const start = i + 2;
      i = source.indexOf('\n', start);
      if (i < 0) i = source.length;
      comments.push(source.slice(start, i));
      regexAllowed = true;
      continue;
    }
    if (c === '/' && next === '*') {
      const start = i + 2;
      const end = source.indexOf('*/', start);
      i = end < 0 ? source.length : end + 2;
      comments.push(source.slice(start, end < 0 ? source.length : end));
      regexAllowed = true;
      continue;
    }
    if (c === '/') {
      if (regexAllowed) {
        i = skipRegex(source, i);
        regexAllowed = false;
      } else {
        i += next === '=' ? 2 : 1;
        regexAllowed = true;
      }
      continue;
    }

    if (/[$_\p{L}]/u.test(c)) {
      const start = i++;
      while (i < source.length && /[$_\p{L}\p{N}]/u.test(source[i])) i++;
      regexAllowed = REGEX_PREFIX_WORDS.has(source.slice(start, i));
      continue;
    }
    if (/\p{N}/u.test(c)) {
      i++;
      while (i < source.length && /[\p{N}a-fA-F_xXobOB.eE+-]/u.test(source[i])) i++;
      regexAllowed = false;
      continue;
    }

    if (c === ')' || c === ']' || c === '}') regexAllowed = false;
    else if (c === '.' || (c === '+' && next === '+') || (c === '-' && next === '-')) {
      regexAllowed = false;
      if (next === c) i++;
    } else {
      regexAllowed = true;
    }
    i++;
  }

  return comments.join('\n');
}

async function collectFiles(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => compareNames(a.name, b.name));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) await collectFiles(full, out);
      continue;
    }
    const extension = extname(entry.name).toLowerCase();
    if (extension === '.md' || extension === '.mdc' || CODE_EXTENSIONS.has(extension)) {
      if (!EXCLUDED_FILES.has(slash(relative(ROOT, full)))) out.push(full);
    }
  }
  return out;
}

export function expandBraces(pattern) {
  const open = pattern.indexOf('{');
  if (open < 0) return [pattern];

  /* Scan to the brace that closes THIS group, and split only on commas at its
     own depth. Cursor globs nest, e.g. "{src/{a,b}.js,test/{c}.mjs}". */
  let depth = 0;
  let close = -1;
  const parts = [];
  let start = open + 1;
  for (let i = open; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { parts.push(pattern.slice(start, i)); close = i; break; }
    } else if (c === ',' && depth === 1) {
      parts.push(pattern.slice(start, i));
      start = i + 1;
    }
  }
  if (close < 0) return [pattern];

  const head = pattern.slice(0, open);
  const tail = pattern.slice(close + 1);
  return parts.flatMap((choice) => expandBraces(head + choice + tail));
}

function globToRegExp(pattern) {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        source += '.*';
        i++;
        if (pattern[i + 1] === '/') i++;
      } else source += '[^/]*';
    } else if (c === '?') source += '[^/]';
    else source += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}

export function routeMatchers(patterns) {
  return patterns.flatMap(expandBraces).map(globToRegExp);
}

/* A file matches more than one route, so a task costs the SUM of the routes it
   triggers, per loader, and the answer is the worst file. src/gait.js matches
   animals and morphology; src/construct.js matches built-form and projection. */
function worstRoute(prompt, paths) {
  let worst = Math.max(prompt.cursorAlways, prompt.claudeAlways);
  let worstPath = null;
  for (const path of paths) {
    let cursor = prompt.cursorAlways;
    let claude = prompt.claudeAlways;
    for (const rule of prompt.routedFiles) {
      if (!rule.matchers.some((re) => re.test(path))) continue;
      if (rule.loader === 'cursor') cursor += rule.words; else claude += rule.words;
    }
    const cost = Math.max(cursor, claude);
    if (cost > worst) { worst = cost; worstPath = path; }
  }
  return { worst, worstPath };
}

export async function measure(root = ROOT) {
  const totals = { markdown: 0, source: 0, testTool: 0 };
  const files = [];
  const allPaths = [];
  const claudeImports = new Set();
  const claudeUnscoped = [];
  const importedWords = new Map();
  const prompt = {
    always: 0,
    cursorAlways: 0,
    claudeAlways: 0,
    routed: 0,
    alwaysFiles: [],
    routedFiles: [],
  };

  for (const full of await collectFiles(root)) {
    const path = slash(relative(root, full));
    allPaths.push(path);
    const extension = extname(path).toLowerCase();
    const text = await readFile(full, 'utf8');
    const promptWords = wordCount(text);
    importedWords.set(path, promptWords);
    /* Two loaders read disjoint file sets, so the always-loaded cost is the
       larger session, never the sum. Cursor reads AGENTS.md and
       .cursor/rules/*.mdc; Claude Code reads CLAUDE.md, whatever it imports,
       and .claude/rules/*.md. AGENTS.md counts for both. */
    const front = () => text.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1] ?? '';
    if (path === 'CLAUDE.md') {
      /* An import costs the same as inline content, so follow them. Backticked
         paths are code spans and are not imports. */
      for (const line of text.split('\n')) {
        const target = line.match(/^@([^\s`]+)\s*$/)?.[1];
        if (target) claudeImports.add(slash(target));
      }
      prompt.claudeAlways += promptWords;
      prompt.alwaysFiles.push({ path, words: promptWords, loader: 'claude' });
    } else if (path === 'AGENTS.md') {
      prompt.cursorAlways += promptWords;
      prompt.alwaysFiles.push({ path, words: promptWords, loader: 'cursor' });
    } else if (path.startsWith('.cursor/rules/') && extension === '.mdc') {
      const always = /^alwaysApply:\s*true\s*$/m.test(front());
      if (always) prompt.cursorAlways += promptWords; else prompt.routed += promptWords;
      const globs = front().match(/^globs:\s*"?(.+?)"?\s*$/m)?.[1] ?? '';
      prompt[always ? 'alwaysFiles' : 'routedFiles'].push({
        path, words: promptWords, loader: 'cursor',
        matchers: always ? [] : routeMatchers(globs ? [globs] : []),
      });
    } else if (path.startsWith('.claude/rules/') && extension === '.md') {
      const routed = /^paths:/m.test(front());
      const declared = [...front().matchAll(/^\s*-\s*"(.+?)"\s*$/gm)].map((m) => m[1]);
      if (routed) {
        prompt.routed += promptWords;
        prompt.routedFiles.push({
          path, words: promptWords, loader: 'claude', matchers: routeMatchers(declared),
        });
      } else {
        claudeUnscoped.push(path);
      }
    }

    let category;
    let words;

    if (extension === '.md') {
      category = 'markdown';
      words = wordCount(text);
    } else if (path.startsWith('src/')) {
      category = 'source';
      words = wordCount(extractJsComments(text));
    } else if (path.startsWith('test/') || path.startsWith('tools/')) {
      category = 'testTool';
      words = wordCount(extractJsComments(text));
    } else {
      continue;
    }

    totals[category] += words;
    if (words) files.push({ path, category, words });
  }

  files.sort((a, b) => b.words - a.words || compareNames(a.path, b.path));
  prompt.alwaysFiles.sort((a, b) => b.words - a.words || compareNames(a.path, b.path));
  prompt.routedFiles.sort((a, b) => b.words - a.words || compareNames(a.path, b.path));
  /* CLAUDE.md is charged in the sweep. Everything it imports is charged here,
     and an unscoped .claude rule only if no import already pulled it in, so a
     file that is both is counted once. */
  const chargedToClaude = new Set();
  for (const target of [...claudeImports, ...claudeUnscoped]) {
    if (chargedToClaude.has(target)) continue;
    chargedToClaude.add(target);
    const words = importedWords.get(target) ?? 0;
    prompt.claudeAlways += words;
    const how = claudeImports.has(target) ? 'imported by CLAUDE.md' : 'unscoped rule';
    prompt.alwaysFiles.push({ path: `${target} (${how})`, words, loader: 'claude' });
  }
  prompt.alwaysFiles.sort((a, b) => b.words - a.words);
  prompt.always = Math.max(prompt.cursorAlways, prompt.claudeAlways);
  prompt.largestRoute = prompt.routedFiles[0]?.words ?? 0;
  /* Every collected path, not just the ones carrying prose. A file with no
     comments still triggers its routes, and measuring it as cheaper because it
     is uncommented inverts the point. */
  const { worst, worstPath } = worstRoute(prompt, allPaths);
  prompt.maxSingleRoute = worst;
  prompt.worstRoutePath = worstPath;
  return {
    ...totals,
    total: totals.markdown + totals.source + totals.testTool,
    files,
    prompt,
  };
}

export async function main() {
  const stats = await measure();
  const estimatedTokens = stats.total * TOKENS_PER_WORD;
  const delta = stats.total - BASELINE;
  const reduction = ((BASELINE - stats.total) / BASELINE) * 100;

  console.log('Frostwind agent prompt context');
  console.log(`  Always-loaded words        ${format(stats.prompt.always)}` + `  (cursor ${format(stats.prompt.cursorAlways)}, claude ${format(stats.prompt.claudeAlways)})`);
  console.log(`  Estimated prompt tokens    ${format(stats.prompt.always * TOKENS_PER_WORD)}`);
  console.log(`  Routed-rule words          ${format(stats.prompt.routed)}`);
  console.log(`  Largest routed rule        ${format(stats.prompt.largestRoute)}`);
  console.log(`  Max single-route words     ${format(stats.prompt.maxSingleRoute)}`);
  console.log('');
  console.log('Always-loaded files');
  for (const file of stats.prompt.alwaysFiles) {
    console.log(`  ${String(format(file.words)).padStart(7)}  ${file.path}`);
  }
  console.log('');
  console.log('Routed rule files');
  for (const file of stats.prompt.routedFiles) {
    console.log(`  ${String(format(file.words)).padStart(7)}  ${file.path}`);
  }
  console.log('');
  console.log('Frostwind repository prose');
  console.log(`  Markdown words             ${format(stats.markdown)}`);
  console.log(`  Source comment words       ${format(stats.source)}`);
  console.log(`  Test/tool comment words    ${format(stats.testTool)}`);
  console.log(`  Total maintained prose     ${format(stats.total)}`);
  console.log(`  Estimated prose tokens     ${format(estimatedTokens)}  (words × 1.3)`);
  console.log('');
  console.log('Maintained prose: Markdown + src comments + test/tool comments');
  console.log(`Baseline: ${format(BASELINE)} words`);
  console.log(`Change vs baseline: ${signed(delta)} words (${reduction.toFixed(1)}% reduction)`);
  console.log(`Target band: ${format(TARGET_LOW)}–${format(TARGET_HIGH)} words (35–45% reduction)`);

  if (stats.total >= TARGET_LOW && stats.total <= TARGET_HIGH) {
    console.log('Target check: within the target band.');
  } else if (stats.total > TARGET_HIGH) {
    console.log(
      `WARNING (non-failing): ${format(stats.total - TARGET_HIGH)} words above the target band.`,
    );
  } else {
    console.log(
      `WARNING (non-failing): ${format(TARGET_LOW - stats.total)} words below the target band; review what was excluded.`,
    );
  }

  console.log('');
  console.log('Top prose-heavy files');
  for (const [index, file] of stats.files.slice(0, 15).entries()) {
    const label = file.category === 'testTool'
      ? 'test/tool'
      : file.category;
    console.log(
      `  ${String(index + 1).padStart(2)}. ${String(format(file.words)).padStart(7)}  ${label.padEnd(9)}  ${file.path}`,
    );
  }
  console.log('');
  console.log(
    'Caveat: the accepted baseline used a stricter historical extractor; the comparison is directional.',
  );
  console.log(
    `Tracked categories: Markdown files, src/ comments, and test/ or tools/ comments.`,
  );
  console.log(
    `Excluded directories: ${[...EXCLUDED_DIRS].sort(compareNames).map((name) => `${name}/`).join(', ')}`,
  );
  if (EXCLUDED_FILES.size) {
    console.log(
      `Excluded files: ${[...EXCLUDED_FILES].sort(compareNames).join(', ')}`,
    );
  }
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
