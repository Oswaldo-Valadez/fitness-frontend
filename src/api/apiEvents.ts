/**
 * Cross-cutting API events. The Axios interceptor in client.ts emits these;
 * app-level listeners (AppInit, a consent banner, etc.) react to them
 * without every call site needing to know about session/consent plumbing.
 */

export interface ConsentRequiredDetail {
  message: string
  returnPath: string
}

type ApiEventMap = {
  'session-expired': CustomEvent<void>
  'consent-required': CustomEvent<ConsentRequiredDetail>
}

class ApiEventBus extends EventTarget {
  emit<K extends keyof ApiEventMap>(type: K, detail?: ApiEventMap[K] extends CustomEvent<infer D> ? D : never) {
    this.dispatchEvent(new CustomEvent(type, { detail }))
  }

  on<K extends keyof ApiEventMap>(type: K, listener: (event: ApiEventMap[K]) => void) {
    this.addEventListener(type, listener as EventListener)
    return () => this.removeEventListener(type, listener as EventListener)
  }
}

export const apiEvents = new ApiEventBus()
