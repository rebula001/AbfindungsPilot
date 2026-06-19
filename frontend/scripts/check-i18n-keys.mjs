#!/usr/bin/env node
/**
 * check-i18n-keys.mjs
 * ------------------------------------------------------------
 * 扫描 `src/i18n/de.ts`、`src/i18n/zh.ts` 和 `src/` 下的源码，检查：
 * 1. 在 locale 文件里定义但源码中从未使用的 key（候选清除）
 *    - 对 de.ts 与 zh.ts 分别报告
 * 2. 在源码中以字面量形式出现、但 locale 缺失的 key（缺失）
 *    - 对 de.ts 与 zh.ts 分别报告
 * 3. de.ts 与 zh.ts 之间的 key 集合差异（翻译同步性）
 *    - de 有 / zh 缺、zh 有 / de 缺
 *
 * 默认仅输出报告，不修改任何文件。加 `--json` 输出机器可读格式。
 *
 * 用法：
 *   npm run i18n:check
 *   npm run i18n:check -- --json
 *
 * 退出码：missing 或跨语言差异不为空 -> 1，否则 0。
 *
 * 检测策略：
 * - 直接字面量：在源码中搜索 `'a.b.c'` / `"a.b.c"` / `a.b.c`（不要求一定在 t() 里）。
 * - 字符串拼接前缀：`a.b.` + var => `a.b.` 视为已使用
 * - 模板字符串前缀/后缀：`a.b.${x}.c` => 以 `a.b.` 开头且以 `.c` 结尾的 key 视为已使用
 * - 父路径访问：`t('a.b')` 取整个对象 => `a.b.*` 视为已使用
 * - 子路径访问：`('a.b.c.d')` => 父中间节点 `a.b`、`a.b.c` 也视为已使用
 *
 * 仍可能存在的边界：完全由变量计算出来的 key（如 `keys[i]`）无法静态分析。
 * 这种 key 必须人工 review。脚本只给出候选列表，绝不自动删除。
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const LOCALES = [
  { code: 'de', file: join(SRC, 'i18n', 'de.ts') },
  { code: 'zh', file: join(SRC, 'i18n', 'zh.ts') }
];

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');

// ---------- 1. 解析 locale 文件 -> 普通 JS 对象 ----------
function loadLocaleObject(file, varName) {
  const raw = readFileSync(file, 'utf8');
  const js = raw.replace(/export\s+default\s*/, `globalThis.${varName} = `).replace(/\}\s*as\s+const\s*;?\s*$/m, '};');
  const ctx = { globalThis: {} };
  vm.createContext(ctx);
  vm.runInContext(js, ctx);
  return ctx.globalThis[varName];
}

// ---------- 2. 收集所有 leaf key 路径（数组视为 leaf） ----------
function collectKeys(obj, prefix = '', out = []) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    out.push(prefix);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    collectKeys(v, next, out);
  }
  return out;
}

// ---------- 3. 遍历 src/（排除 i18n/） ----------
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'i18n' || name.startsWith('.')) continue;
      walk(full, out);
    } else if (/\.(vue|ts|tsx|js|mjs)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

// ---------- 4. 提取源码中所有 "key 字面量" ----------
const LITERAL_KEY_RE = /([`'"])(([a-zA-Z_]\w*(?:\.\w+)+))\1/g;
const CONCAT_PREFIX_RE = /([`'"])(([a-zA-Z_]\w*(?:\.\w+)+)\.)\1\s*\+/g;
const TEMPLATE_RE = /([a-zA-Z_]\w*(?:\.\w+)+\.)\$\{[^}]+\}((?:\.\w+)*)/g;

function scanSources(files) {
  const literals = new Set();
  const concatPrefixes = new Set();
  const templatePairs = [];
  for (const file of files) {
    const txt = readFileSync(file, 'utf8');
    for (const m of txt.matchAll(LITERAL_KEY_RE)) literals.add(m[2]);
    for (const m of txt.matchAll(CONCAT_PREFIX_RE)) concatPrefixes.add(m[2]);
    for (const m of txt.matchAll(TEMPLATE_RE)) {
      templatePairs.push({ prefix: m[1], suffix: m[2] || '' });
    }
  }

  return { literals, concatPrefixes, templatePairs };
}

// ---------- 5. 判断 locale key 是否被使用 ----------
function isKeyUsed(key, ctx) {
  const { literals, concatPrefixes, templatePairs } = ctx;
  if (literals.has(key)) return true;
  for (const lit of literals) {
    if (key.startsWith(lit + '.')) return true;
    if (lit.startsWith(key + '.')) return true;
  }
  for (const pre of concatPrefixes) {
    if (key.startsWith(pre)) return true;
  }
  for (const { prefix, suffix } of templatePairs) {
    if (key.startsWith(prefix) && (suffix === '' || key.endsWith(suffix))) return true;
  }
  return false;
}

// ---------- 6. 计算 missing：在源码中作为字面量出现但该 locale 未定义的 key ----------
function computeMissing(literals, definedSet, knownNs, srcCtx) {
  return [...literals].filter((k) => {
    if (!knownNs.has(k.split('.')[0])) return false;
    if (definedSet.has(k)) return false;
    for (const def of definedSet) {
      if (k.startsWith(def + '.') || def.startsWith(k + '.')) return false;
    }
    for (const pre of srcCtx.concatPrefixes) if (k.startsWith(pre)) return false;
    for (const { prefix, suffix } of srcCtx.templatePairs) {
      if (k.startsWith(prefix) && (suffix === '' || k.endsWith(suffix))) return false;
    }
    return true;
  });
}

// ---------- 7. 主流程 ----------
const byLocale = (a, b) => a.localeCompare(b);
const files = walk(SRC);
const srcCtx = scanSources(files);

const localeReports = LOCALES.map(({ code, file }) => {
  const obj = loadLocaleObject(file, `__${code.toUpperCase()}__`);
  const allKeys = collectKeys(obj);
  const definedSet = new Set(allKeys);
  const knownNs = new Set(allKeys.map((x) => x.split('.')[0]));
  const unused = allKeys.filter((k) => !isKeyUsed(k, srcCtx)).toSorted(byLocale);
  const missing = computeMissing(srcCtx.literals, definedSet, knownNs, srcCtx).toSorted(byLocale);
  return { code, file, allKeys, definedSet, unused, missing };
});

// 跨语言 key 差异（以叶子 key 为单位）
const [deReport, zhReport] = localeReports;
const inDeNotInZh = deReport.allKeys.filter((k) => !zhReport.definedSet.has(k)).toSorted(byLocale);
const inZhNotInDe = zhReport.allKeys.filter((k) => !deReport.definedSet.has(k)).toSorted(byLocale);

const totalMissing = localeReports.reduce((acc, r) => acc + r.missing.length, 0);
const totalDiff = inDeNotInZh.length + inZhNotInDe.length;

if (asJson) {
  console.log(
    JSON.stringify(
      {
        literalsFound: srcCtx.literals.size,
        concatPrefixes: [...srcCtx.concatPrefixes].toSorted(byLocale),
        templatePatterns: [...new Set(srcCtx.templatePairs.map((p) => `${p.prefix}*${p.suffix}`))].toSorted(byLocale),
        locales: localeReports.map(({ code, allKeys, unused, missing }) => ({
          code,
          totalKeys: allKeys.length,
          unused,
          missing
        })),
        crossLocaleDiff: { inDeNotInZh, inZhNotInDe }
      },
      null,
      2
    )
  );
} else {
  const rel = (f) => relative(ROOT, f).split(sep).join('/');
  console.log('扫描完成：');
  for (const r of localeReports) {
    console.log(`  - ${r.code}.ts leaf keys: ${r.allKeys.length}`);
  }

  console.log(`  - 字面量 key 命中 : ${srcCtx.literals.size}`);
  console.log(`  - 拼接前缀       : ${srcCtx.concatPrefixes.size}`);
  console.log(`  - 模板拼接模式   : ${srcCtx.templatePairs.length}`);
  console.log(`  - 扫描的源文件   : ${files.length}`);
  console.log('');

  if (srcCtx.concatPrefixes.size > 0) {
    console.log('拼接前缀（prefix.* + var）：');
    for (const p of [...srcCtx.concatPrefixes].toSorted(byLocale)) console.log(`  ~ ${p}*`);
    console.log('');
  }

  if (srcCtx.templatePairs.length > 0) {
    console.log('模板拼接（prefix.${...}.suffix）：');
    const seen = new Set();
    for (const { prefix, suffix } of srcCtx.templatePairs) {
      const k = `${prefix}*${suffix}`;
      if (seen.has(k)) continue;
      seen.add(k);
      console.log(`  ~ ${k}`);
    }
    console.log('');
  }

  console.log('跨语言 key 差异（de.ts ↔ zh.ts）：');
  if (inDeNotInZh.length === 0 && inZhNotInDe.length === 0) {
    console.log('  de.ts 与 zh.ts 的 key 集合完全一致。');
  } else {
    if (inDeNotInZh.length > 0) {
      console.log(`  de 有但 zh 缺失（${inDeNotInZh.length}）- 需要补译：`);
      for (const k of inDeNotInZh) console.log(`    x ${k}`);
      console.log('');
    }
    if (inZhNotInDe.length > 0) {
      console.log(`  zh 有但 de 缺失（${inZhNotInDe.length}）- zh 多余 / de 待补：`);
      for (const k of inZhNotInDe) console.log(`    x ${k}`);
      console.log('');
    }
  }

  console.log('');

  // 各 locale 的 missing / unused 报告
  for (const r of localeReports) {
    console.log('----------------------------------------');
    console.log(`${r.code}.ts (${rel(r.file)})`);
    console.log('----------------------------------------');

    if (r.missing.length > 0) {
      console.log(`在源码中作为字面量出现但 ${r.code}.ts 缺失的 key（${r.missing.length}）：`);
      for (const k of r.missing) console.log(`  x ${k}`);
      console.log('');
    }

    if (r.unused.length === 0) {
      console.log(`${r.code}.ts 没有未使用的 i18n key。`);
    } else {
      console.log(`${r.code}.ts 未使用的 key（${r.unused.length}）- 候选清除：`);
      for (const k of r.unused) console.log(`  • ${k}`);
    }

    console.log('');
  }

  if (localeReports.some((r) => r.unused.length > 0)) {
    console.log('提示：请在删除前肉眼确认：');
    console.log('  - 是否被完全动态计算的 key 引用（脚本无法静态分析）');
    console.log('  - 是否是新功能的预留 key');
  }
}

process.exit(totalMissing > 0 || totalDiff > 0 ? 1 : 0);
