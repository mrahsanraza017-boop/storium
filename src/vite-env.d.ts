/// <reference types="vite/client" />

declare global {
  interface Window {
    fbq?: {
      (action: 'init', pixelId: string, options?: Record<string, any>): void;
      (action: 'track', eventName: string, params?: Record<string, any>, options?: { eventID?: string }): void;
      (action: 'trackCustom', eventName: string, params?: Record<string, any>, options?: { eventID?: string }): void;
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: any;
    gtag?: (...args: any[]) => void;
  }
}
