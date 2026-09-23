// Тонкая обёртка над MAX Bridge SDK. Вне мессенджера MAX всё деградирует
// в demo-режим, чтобы приложение открывалось в обычном браузере.

interface MaxUser {
  id: number;
  name: string;
  avatar_url?: string | null;
}

interface MaxWebApp {
  initData?: string;
  initDataUnsafe?: { user?: MaxUser };
  ready?: () => void;
  expand?: () => void;
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred?: (type: 'success' | 'warning' | 'error') => void;
  };
  colorScheme?: 'light' | 'dark';
}

declare global {
  interface Window {
    WebApp?: MaxWebApp;
    MAX?: { WebApp?: MaxWebApp };
  }
}

function getWebApp(): MaxWebApp | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.MAX?.WebApp ?? window.WebApp;
}

export const isInsideMax = (): boolean => Boolean(getWebApp()?.initData);

/** Строка initData для заголовка Authorization: Bearer <initData>. */
export function getInitData(): string | null {
  return getWebApp()?.initData ?? null;
}

/** Демо-пользователь, если открыто вне MAX. */
export function getCurrentUser(): MaxUser {
  const u = getWebApp()?.initDataUnsafe?.user;
  if (u) return u;
  return { id: 0, name: 'Демо-волонтёр', avatar_url: null };
}

/** Сообщить клиенту MAX, что мини-апп готов, и развернуть на весь экран. */
export function initMax(): void {
  const app = getWebApp();
  try {
    app?.ready?.();
    app?.expand?.();
  } catch {
    /* вне MAX — игнорируем */
  }
}

/** Тактильный отклик (если поддерживается платформой). */
export function haptic(type: 'success' | 'warning' | 'error' | 'tap'): void {
  const hf = getWebApp()?.HapticFeedback;
  try {
    if (type === 'tap') hf?.impactOccurred?.('light');
    else hf?.notificationOccurred?.(type);
  } catch {
    /* no-op */
  }
}
