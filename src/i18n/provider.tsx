'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from './config';
import type { Messages } from './messages';
import { interpolate } from './messages';

interface LocaleContextValue {
  locale: Locale;
  dict: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Messages;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext)?.locale ?? 'ko';
}

export function useDict(): Messages {
  const ctx = useContext(LocaleContext);
  return ctx?.dict ?? ({} as Messages);
}

export function useT() {
  const dict = useDict();
  const locale = useLocale();
  function t(path: string, vars?: Record<string, string | number>): string {
    const parts = path.split('.');
    let cur: unknown = dict;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return path;
      }
    }
    if (typeof cur !== 'string') return path;
    return interpolate(cur, vars);
  }
  return { t, locale, dict };
}
