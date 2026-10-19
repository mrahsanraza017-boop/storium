/**
 * STORIUM PWA Controller
 * Handles Service Worker registration, install promotion, and network status
 */

let deferredInstallPrompt: any = null;
const installListeners = new Set<(canInstall: boolean) => void>();
const onlineListeners = new Set<(isOnline: boolean) => void>();

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates periodically
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.info('STORIUM PWA update ready');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped/failed:', err);
      });
  });

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((fn) => fn(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
  });

  // Network status listeners
  window.addEventListener('online', () => {
    onlineListeners.forEach((fn) => fn(true));
  });
  window.addEventListener('offline', () => {
    onlineListeners.forEach((fn) => fn(false));
  });
}

export function canInstallPwa(): boolean {
  return Boolean(deferredInstallPrompt) && !isPwaInstalled();
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;

  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
    return outcome === 'accepted';
  } catch (err) {
    console.warn('Install prompt error:', err);
    return false;
  }
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  installListeners.add(callback);
  callback(canInstallPwa());
  return () => {
    installListeners.delete(callback);
  };
}

export const isPwaInstallable = canInstallPwa;
export const onPwaInstallAvailable = subscribeToInstallPrompt;

export function subscribeToOnlineStatus(callback: (isOnline: boolean) => void): () => void {
  onlineListeners.add(callback);
  if (typeof navigator !== 'undefined') {
    callback(navigator.onLine);
  }
  return () => {
    onlineListeners.delete(callback);
  };
}
