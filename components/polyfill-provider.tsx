"use client"

import { useEffect } from "react"

/**
 * PolyfillProvider - Adds browser compatibility polyfills on the client side
 * 
 * URL.parse() is not supported in Safari < 18 (released Sept 2024)
 * This component ensures the polyfill runs before other components that need it
 */
export function PolyfillProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Polyfill for URL.parse() - Safari 17 and earlier don't support this
    if (typeof URL.parse !== 'function') {
      (URL as any).parse = function(url: string, base?: string | URL): URL | null {
        try {
          return new URL(url, base);
        } catch {
          return null;
        }
      };
      console.log('[Polyfill] Added URL.parse polyfill for Safari compatibility');
    }
  }, []);

  return <>{children}</>;
}
