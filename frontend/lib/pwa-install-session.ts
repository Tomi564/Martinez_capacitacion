/** Secuencia PWA → push en la pestaña actual (sessionStorage, sobrevive refresh). */

const PWA_DISMISSED_KEY = 'martinez-pwa-install-dismissed';
const PWA_PENDING_KEY = 'martinez-pwa-prompt-pending';
const PWA_CERRADO_KEY = 'martinez-pwa-modal-cerrado';

function ss(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

let dismissedThisSession = false;

export function isPwaInstallDismissedThisSession(): boolean {
  if (dismissedThisSession) return true;
  return ss()?.getItem(PWA_DISMISSED_KEY) === '1';
}

export function dismissPwaInstallThisSession(): void {
  dismissedThisSession = true;
  ss()?.setItem(PWA_DISMISSED_KEY, '1');
}

export function markPwaPromptPendingSession(): void {
  ss()?.setItem(PWA_PENDING_KEY, '1');
  ss()?.removeItem(PWA_CERRADO_KEY);
}

export function clearPwaPromptPendingSession(): void {
  ss()?.removeItem(PWA_PENDING_KEY);
}

export function isPwaPromptPendingSession(): boolean {
  return ss()?.getItem(PWA_PENDING_KEY) === '1';
}

export function markPwaModalCerradoSession(): void {
  ss()?.setItem(PWA_CERRADO_KEY, '1');
  clearPwaPromptPendingSession();
}

export function isPwaModalCerradoSession(): boolean {
  return ss()?.getItem(PWA_CERRADO_KEY) === '1';
}

export function resetPwaInstallSession(): void {
  dismissedThisSession = false;
  ss()?.removeItem(PWA_DISMISSED_KEY);
  ss()?.removeItem(PWA_PENDING_KEY);
  ss()?.removeItem(PWA_CERRADO_KEY);
}
