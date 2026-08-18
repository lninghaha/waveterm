// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

/**
 * Soft-fork i18n core shared by Electron main and the React renderer.
 *
 * Keep this module free of React so emain can import it.
 * Wrap existing English UI strings with t("...") and put translations in locales/zh-CN.json.
 * Do not replace English source strings in place — that makes upstream rebases painful.
 */

import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: LocaleCode = "zh-CN";

type Catalog = Record<string, string>;

const catalogs: Record<LocaleCode, Catalog> = {
    en: en as Catalog,
    "zh-CN": zhCN as Catalog,
};

let currentLocale: LocaleCode = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function notify(): void {
    for (const listener of listeners) {
        listener();
    }
}

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
    return value === "en" || value === "zh-CN";
}

export function normalizeLocale(value: string | null | undefined): LocaleCode {
    if (isLocaleCode(value)) {
        return value;
    }
    if (value?.toLowerCase().startsWith("zh")) {
        return "zh-CN";
    }
    if (value?.toLowerCase().startsWith("en")) {
        return "en";
    }
    return DEFAULT_LOCALE;
}

export function getLocale(): LocaleCode {
    return currentLocale;
}

export function subscribeLocale(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function setLocale(locale: string | null | undefined): LocaleCode {
    const next = normalizeLocale(locale);
    if (next === currentLocale) {
        return currentLocale;
    }
    currentLocale = next;
    if (typeof document !== "undefined") {
        document.documentElement.lang = next;
    }
    notify();
    return currentLocale;
}

export function applyLocaleFromSettings(settings?: { "app:language"?: string } | null): LocaleCode {
    return setLocale(settings?.["app:language"] ?? DEFAULT_LOCALE);
}

export type TParams = Record<string, string | number>;

export function t(key: string, params?: TParams): string {
    const table = catalogs[currentLocale] ?? catalogs.en;
    let text = table[key] ?? catalogs.en[key] ?? key;
    if (params) {
        for (const [name, value] of Object.entries(params)) {
            text = text.replaceAll(`{{${name}}}`, String(value));
        }
    }
    return text;
}
