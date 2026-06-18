// vue-i18n 初始化：
// - 默认语言为德语（de），fallback 也是 de（保证未翻译的键不暴露）
// - 支持 de / zh 两种语言；从 localStorage 读取/写入用户偏好
// - cacheLanguage() 供顶部语言切换按钮调用
import { createI18n } from 'vue-i18n';
import de from './de';
import zh from './zh';

export type Language = 'de' | 'zh';

const STORAGE_KEY = 'abfindungspilot.language.v1';

// 从 localStorage 读取上次选择的语言；无则回退到德语
function loadInitialLanguage(): Language {
  if (globalThis.window === undefined) return 'de';
  const stored = globalThis.localStorage.getItem(STORAGE_KEY);
  return stored === 'zh' || stored === 'de' ? stored : 'de';
}

// 写入用户语言偏好（由顶部 DE/ZH 按钮调用）
export function cacheLanguage(language: Language): void {
  if (globalThis.window === undefined) return;
  globalThis.localStorage.setItem(STORAGE_KEY, language);
}

export const i18n = createI18n({
  legacy: false,
  locale: loadInitialLanguage(),
  fallbackLocale: 'de',
  // Tooltip-Texte enthalten bewusst HTML (<p>/<ul>/<li>/<strong>); Inhalte stammen ausschließlich
  // aus statischen Locale-Dateien, daher kein XSS-Risiko. Warnung deaktivieren.
  warnHtmlMessage: false,
  messages: { de, zh }
});
