"use client";

import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center">
      <span className="sr-only">{t("nav.language")}</span>
      <select
        className="min-h-11 rounded-full border border-line bg-card px-3 text-sm font-semibold"
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </label>
  );
}
