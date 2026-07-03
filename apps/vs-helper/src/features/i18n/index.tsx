import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SUPPORTED_LANGS,
  translations,
  type Lang,
  type TranslationKey,
} from "./translations";

export {
  SUPPORTED_LANGS,
  LANG_NAMES,
  type Lang,
  type TranslationKey,
} from "./translations";

const STORAGE_KEY = "vs.lang";

function isLang(value: string): value is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

/** Best-effort device language, falling back to English. */
export function detectDeviceLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g. "pt-BR"
    const primary = locale.split("-")[0].toLowerCase();
    return isLang(primary) ? primary : "en";
  } catch {
    return "en";
  }
}

/** Reads the saved language, or the device default on first run. */
export async function getInitialLang(): Promise<Lang> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored && isLang(stored)) return stored;
  return detectDeviceLang();
}

async function persistLang(lang: Lang): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

/**
 * Pure translation lookup for non-React code paths (e.g. notifications).
 * Falls back to English, then to the key itself, so nothing renders blank.
 */
export function translate(
  lang: Lang,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dict = translations[lang] ?? translations.en;
  const template = dict[key] ?? translations.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    void persistLang(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
