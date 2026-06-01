/** Dismiss del modal PWA solo hasta el próximo login (no persiste en localStorage). */
let dismissedThisSession = false;

export function isPwaInstallDismissedThisSession(): boolean {
  return dismissedThisSession;
}

export function dismissPwaInstallThisSession(): void {
  dismissedThisSession = true;
}

export function resetPwaInstallSession(): void {
  dismissedThisSession = false;
}
