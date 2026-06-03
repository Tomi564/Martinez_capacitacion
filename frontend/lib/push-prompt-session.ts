/** Dismiss del modal push solo hasta el próximo login (no persiste en localStorage). */
let dismissedThisSession = false;

export function isPushPromptDismissedThisSession(): boolean {
  return dismissedThisSession;
}

export function dismissPushPromptThisSession(): void {
  dismissedThisSession = true;
}

export function resetPushPromptSession(): void {
  dismissedThisSession = false;
}
